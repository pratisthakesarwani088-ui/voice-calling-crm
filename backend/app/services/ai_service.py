"""
Gemini AI service - low-level, reusable text generation.

This is deliberately the ONLY place in the codebase that knows how to
talk to Gemini. Everything else (the CRM-context-building layer in
app/services/ai_context_service.py, and eventually a Voice Calling
module) calls `generate_ai_response()` and never touches the Gemini API
directly. That's what "modular and reusable for future Voice Calling
integration" means in practice: a future module can pass it a live
conversation turn instead of a CRM Q&A prompt, and it works unchanged.

Calls the Gemini REST API directly over HTTP (via httpx) rather than a
version-pinned SDK - fewer moving parts, and full control over the
timeout/error handling the Module 8 spec asks for.
"""

import httpx

from app.config.settings import settings
from app.utils.exceptions import AIConfigurationError, AIServiceError, AITimeoutError


async def generate_ai_response(prompt: str, system_instruction: str | None = None) -> str:
    """
    Send a prompt to Gemini and return the generated text.

    Raises (never lets a raw httpx/network exception escape):
      - AIConfigurationError if GEMINI_API_KEY isn't set
      - AITimeoutError if the request exceeds GEMINI_TIMEOUT_SECONDS
      - AIServiceError for any other failure (network error, non-2xx
        response, or a response that doesn't contain usable text -
        e.g. blocked by Gemini's safety filters)
    """
    if not settings.is_gemini_configured:
        raise AIConfigurationError(
            "AI features are not configured. Set GEMINI_API_KEY in the backend environment."
        )

    url = f"{settings.GEMINI_API_BASE_URL}/models/{settings.GEMINI_MODEL}:generateContent"

    payload: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
            "temperature": settings.GEMINI_TEMPERATURE,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    try:
        async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
            )
    except httpx.TimeoutException as exc:
        raise AITimeoutError("The AI service took too long to respond. Please try again.") from exc
    except httpx.RequestError as exc:
        # DNS failure, connection refused, etc. - the request never got a response at all.
        raise AIServiceError("Could not reach the AI service. Please try again shortly.") from exc

    if response.status_code == 401 or response.status_code == 403:
        raise AIConfigurationError("The configured GEMINI_API_KEY was rejected by the AI service.")
    if response.status_code == 429:
        raise AIServiceError("The AI service is rate-limited right now. Please try again shortly.")
    if response.status_code >= 400:
        # Never surface the raw upstream body to the client - it could
        # echo back request details we don't want to expose, and isn't
        # meaningful to an end user anyway.
        raise AIServiceError(f"The AI service returned an error (status {response.status_code}).")

    return _extract_text(response)


def _extract_text(response: httpx.Response) -> str:
    """Parse Gemini's response shape defensively - never trust an external API's JSON blindly."""
    try:
        data = response.json()
    except ValueError as exc:
        raise AIServiceError("The AI service returned an unreadable response.") from exc

    candidates = data.get("candidates") or []
    if not candidates:
        # A prompt can be blocked before any candidate is generated
        # (promptFeedback.blockReason) - surface that distinctly rather
        # than a generic "no response" message.
        block_reason = (data.get("promptFeedback") or {}).get("blockReason")
        if block_reason:
            raise AIServiceError(f"The AI service declined to respond ({block_reason}).")
        raise AIServiceError("The AI service returned no response.")

    first_candidate = candidates[0]
    finish_reason = first_candidate.get("finishReason")
    if finish_reason == "SAFETY":
        raise AIServiceError("The AI service's response was blocked by its safety filters.")

    parts = (first_candidate.get("content") or {}).get("parts") or []
    text_parts = [part.get("text", "") for part in parts if part.get("text")]

    if not text_parts:
        raise AIServiceError("The AI service returned an empty response.")

    return "".join(text_parts).strip()
