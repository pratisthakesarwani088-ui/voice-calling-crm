"""
Vapi voice calling service - low-level, reusable.

Mirrors app/services/ai_service.py's shape exactly: this is the ONLY
place in the codebase that talks to Vapi's REST API directly. Calls
the API over HTTP (httpx) rather than an SDK, for the same reasons as
ai_service.py - full control over timeout/error handling, no version-
pinned SDK surface to track.

ElevenLabs isn't called directly by this backend at all: Vapi is
configured (via the `voice` block in the assistant config below) to
use ElevenLabs as its text-to-speech provider internally. This is the
standard way these two services combine in a real deployment - our
job is to tell Vapi which ElevenLabs voice to use, not to reimplement
Vapi's own ElevenLabs integration.
"""

import httpx

from app.config.settings import settings
from app.utils.exceptions import (
    VoiceCallConfigurationError,
    VoiceCallServiceError,
    VoiceCallTimeoutError,
)


def _elevenlabs_voice_config() -> dict:
    """The `voice` block Vapi expects to route TTS through ElevenLabs."""
    return {
        "provider": "11labs",
        "voiceId": settings.ELEVENLABS_VOICE_ID,
    }


async def start_vapi_call(*, phone_number: str, system_prompt: str, first_message: str) -> dict:
    """
    Ask Vapi to place an outbound call using ElevenLabs for the voice.

    Returns Vapi's raw call object (contains at least an `id` and an
    initial `status`) on success. Raises the same three-exception
    pattern as ai_service.generate_ai_response: VoiceCallConfigurationError,
    VoiceCallTimeoutError, VoiceCallServiceError.
    """
    if not settings.is_voice_calling_configured:
        raise VoiceCallConfigurationError(
            "Real Call mode is not configured. Set VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, "
            "ELEVENLABS_API_KEY, and ELEVENLABS_VOICE_ID in the backend environment."
        )

    assistant_config = {
        "firstMessage": first_message,
        "model": {
            "provider": "google",
            "model": settings.GEMINI_MODEL,
            "messages": [{"role": "system", "content": system_prompt}],
        },
        "voice": _elevenlabs_voice_config(),
        # Explicitly requested — without this, Vapi has no obligation to
        # produce a recording at all, meaning call.recording_url would
        # stay empty even for a fully successful call. This is what
        # actually makes "every completed call is recorded" true; the
        # save-it-when-present logic in call_service.py's
        # _apply_vapi_update only has something to save because of this.
        "recordingEnabled": True,
        # Real duration limit — Vapi itself ends the call once this
        # many seconds elapse, rather than relying on our own polling
        # loop to notice and force a hang-up (which could lag behind
        # by up to REAL_CALL_POLL_INTERVAL_MS on the frontend). Same
        # value Demo Call's simulated duration is capped at, so "the
        # call length limit" means one thing across both modes.
        "maxDurationSeconds": settings.MAX_CALL_DURATION_SECONDS,
    }
    if settings.PUBLIC_BASE_URL:
        # Tells Vapi where to POST status-update/end-of-call webhook
        # events — see app/routes/calls.py's /webhook route. Omitted
        # entirely when there's no public URL to give it (local dev);
        # Real calls still work via GET /{call_id}/status polling alone.
        assistant_config["serverUrl"] = (
            f"{settings.PUBLIC_BASE_URL.rstrip('/')}{settings.API_V1_PREFIX}/calls/webhook"
        )

    payload = {
        "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
        "customer": {"number": phone_number},
        "assistant": assistant_config,
    }

    return await _request("POST", "/call", json=payload)


async def get_vapi_call(external_call_id: str) -> dict:
    """Fetch a call's current status from Vapi - used to poll a Real call's live progress."""
    if not settings.is_voice_calling_configured:
        raise VoiceCallConfigurationError(
            "Real Call mode is not configured. Set VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, "
            "ELEVENLABS_API_KEY, and ELEVENLABS_VOICE_ID in the backend environment."
        )
    return await _request("GET", f"/call/{external_call_id}")


async def end_vapi_call(external_call_id: str) -> dict:
    """Ask Vapi to hang up an in-progress call."""
    if not settings.is_voice_calling_configured:
        raise VoiceCallConfigurationError(
            "Real Call mode is not configured. Set VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, "
            "ELEVENLABS_API_KEY, and ELEVENLABS_VOICE_ID in the backend environment."
        )
    return await _request("POST", f"/call/{external_call_id}/end")


async def _request(method: str, path: str, **kwargs) -> dict:
    """Shared HTTP request handling - auth header, timeout, and error mapping in one place."""
    url = f"{settings.VAPI_API_BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {settings.VAPI_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=settings.VAPI_TIMEOUT_SECONDS) as client:
            response = await client.request(method, url, headers=headers, **kwargs)
    except httpx.TimeoutException as exc:
        raise VoiceCallTimeoutError(
            "The voice calling service took too long to respond. Please try again."
        ) from exc
    except httpx.RequestError as exc:
        raise VoiceCallServiceError(
            "Could not reach the voice calling service. Please try again shortly."
        ) from exc

    if response.status_code in (401, 403):
        raise VoiceCallConfigurationError(
            "The configured Vapi API key was rejected by the voice calling service."
        )
    if response.status_code == 429:
        raise VoiceCallServiceError(
            "The voice calling service is rate-limited right now. Please try again shortly."
        )
    if response.status_code >= 400:
        raise VoiceCallServiceError(
            f"The voice calling service returned an error (status {response.status_code})."
        )

    try:
        return response.json()
    except ValueError as exc:
        raise VoiceCallServiceError(
            "The voice calling service returned an unreadable response."
        ) from exc
