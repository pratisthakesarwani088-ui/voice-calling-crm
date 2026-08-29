"""
Settings service.

get_settings/update_settings back the Settings page's view/edit
features. test_ai_connection/test_voice_connection are small,
self-contained connectivity checks - deliberately NOT reusing
app.services.ai_service / voice_call_service, since those are wired to
the env-var-based app.config.settings singleton and this module needs
to test arbitrary (possibly unsaved) credentials without touching that
existing, working pipeline. test_telephony_connection instead delegates
to the Module 12 provider abstraction (app/services/telephony/). Per
Modules 11-12's "minimal, backward compatible" scope, ai_service.py and
voice_call_service.py are not modified at all.
"""

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.app_settings import AppSettings
from app.models.enums import TelephonyProvider
from app.schemas.settings import SettingsUpdate
from app.services.telephony import create_provider

_MASK_CHAR = "\u2022"
_TEST_TIMEOUT_SECONDS = 10.0


def mask_secret(value: str | None) -> str | None:
    """Show only the last 4 characters of a secret, e.g. a masked string ending in 3f2a."""
    if not value:
        return value
    if len(value) <= 4:
        return _MASK_CHAR * len(value)
    return _MASK_CHAR * (len(value) - 4) + value[-4:]


def _is_masked_placeholder(value: str | None) -> bool:
    """A real API key/token would never contain the mask character."""
    return bool(value) and _MASK_CHAR in value


def get_or_create_settings(db: Session) -> AppSettings:
    """
    This CRM has exactly one settings row (single-admin app, same
    reasoning as Module 3's single-Admin-account design) - created
    lazily on first access rather than via a migration data-seed.
    """
    settings_row = db.execute(select(AppSettings).limit(1)).scalar_one_or_none()
    if settings_row is None:
        settings_row = AppSettings()
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


def update_settings(db: Session, payload: SettingsUpdate) -> AppSettings:
    """
    Apply only the fields the client actually sent. A masked placeholder
    for a secret field (still containing the mask character) means "the
    admin didn't change this" and is skipped, not saved literally.
    """
    settings_row = get_or_create_settings(db)

    for field_name, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        if isinstance(value, str) and _is_masked_placeholder(value):
            continue
        setattr(settings_row, field_name, value)

    db.commit()
    db.refresh(settings_row)
    return settings_row


def to_masked_dict(settings_row: AppSettings) -> dict:
    """Build the SettingsOut payload with every secret field masked."""
    return {
        "company_name": settings_row.company_name,
        "company_logo_url": settings_row.company_logo_url,
        "timezone": settings_row.timezone,
        "gemini_api_key": mask_secret(settings_row.gemini_api_key),
        "gemini_model": settings_row.gemini_model,
        "vapi_api_key": mask_secret(settings_row.vapi_api_key),
        "vapi_assistant_id": settings_row.vapi_assistant_id,
        "elevenlabs_api_key": mask_secret(settings_row.elevenlabs_api_key),
        "elevenlabs_voice_id": settings_row.elevenlabs_voice_id,
        "telephony_provider": settings_row.telephony_provider,
        "telephony_account_id": mask_secret(settings_row.telephony_account_id),
        "telephony_auth_token": mask_secret(settings_row.telephony_auth_token),
        "telephony_caller_number": settings_row.telephony_caller_number,
    }


async def test_ai_connection(api_key: str | None, model: str | None) -> tuple[bool, str]:
    """Minimal Gemini connectivity check - not a full grounded call, just 'does this key work'."""
    if not api_key or not model:
        return False, "Gemini API key and model are required."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=_TEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                url,
                params={"key": api_key},
                json={"contents": [{"role": "user", "parts": [{"text": "ping"}]}]},
            )
    except httpx.TimeoutException:
        return False, "Gemini did not respond in time."
    except httpx.RequestError as exc:
        return False, f"Could not reach Gemini: {exc}"

    if response.status_code in (401, 403):
        return False, "Gemini rejected this API key."
    if response.status_code >= 400:
        return False, f"Gemini returned an error (status {response.status_code})."
    return True, "Gemini connection successful."


async def test_voice_connection(
    vapi_api_key: str | None, elevenlabs_api_key: str | None, elevenlabs_voice_id: str | None
) -> tuple[bool, str]:
    """Checks Vapi's key and ElevenLabs' key/voice id independently, combining the results."""
    if not vapi_api_key:
        return False, "Vapi API key is required."
    if not elevenlabs_api_key or not elevenlabs_voice_id:
        return False, "ElevenLabs API key and voice ID are required."

    try:
        async with httpx.AsyncClient(timeout=_TEST_TIMEOUT_SECONDS) as client:
            vapi_response = await client.get(
                "https://api.vapi.ai/assistant",
                headers={"Authorization": f"Bearer {vapi_api_key}"},
            )
            elevenlabs_response = await client.get(
                f"https://api.elevenlabs.io/v1/voices/{elevenlabs_voice_id}",
                headers={"xi-api-key": elevenlabs_api_key},
            )
    except httpx.TimeoutException:
        return False, "Voice provider did not respond in time."
    except httpx.RequestError as exc:
        return False, f"Could not reach the voice provider: {exc}"

    if vapi_response.status_code in (401, 403):
        return False, "Vapi rejected this API key."
    if vapi_response.status_code >= 400:
        return False, f"Vapi returned an error (status {vapi_response.status_code})."

    if elevenlabs_response.status_code in (401, 403):
        return False, "ElevenLabs rejected this API key."
    if elevenlabs_response.status_code == 404:
        return False, "ElevenLabs voice ID was not found."
    if elevenlabs_response.status_code >= 400:
        return False, f"ElevenLabs returned an error (status {elevenlabs_response.status_code})."

    return True, "Vapi and ElevenLabs connections successful."


async def test_telephony_connection(
    provider: TelephonyProvider | None, account_id: str | None, auth_token: str | None
) -> tuple[bool, str]:
    """
    Delegates to the Module 12 telephony provider abstraction
    (app/services/telephony/) instead of branching on provider type
    inline — the Twilio/Exotel-specific request logic lives in each
    provider class now, not duplicated here.
    """
    if not provider or not account_id or not auth_token:
        return False, "Telephony provider, account ID, and auth token are required."

    telephony_provider = create_provider(provider, account_id, auth_token)
    return await telephony_provider.test_connection()
