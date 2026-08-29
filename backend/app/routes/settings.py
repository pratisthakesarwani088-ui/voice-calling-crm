"""
Settings routes.

JWT-protected via get_current_user, same as every other business
route. Thin: validates via Pydantic, calls the service, maps
exceptions to HTTP responses.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.settings import (
    ChangePasswordRequest,
    SettingsOut,
    SettingsUpdate,
    TestAIRequest,
    TestResult,
    TestTelephonyRequest,
    TestVoiceRequest,
)
from app.services.auth_service import change_password
from app.services.settings_service import (
    get_or_create_settings,
    test_ai_connection,
    test_telephony_connection,
    test_voice_connection,
    to_masked_dict,
    update_settings,
)
from app.utils.exceptions import InvalidCurrentPasswordError

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsOut)
def get_settings_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Current settings, with API keys/tokens masked."""
    return SettingsOut(**to_masked_dict(get_or_create_settings(db)))


@router.put("", response_model=SettingsOut)
def update_settings_route(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update settings. Fields left as their masked placeholder are left unchanged."""
    settings_row = update_settings(db, payload)
    return SettingsOut(**to_masked_dict(settings_row))


@router.post("/change-password", response_model=MessageResponse)
def change_password_route(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current admin's password."""
    try:
        change_password(db, current_user, payload.current_password, payload.new_password)
    except InvalidCurrentPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return MessageResponse(message="Password changed successfully.")


@router.post("/test-ai", response_model=TestResult)
async def test_ai_route(
    payload: TestAIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test Gemini connectivity - uses the request's values, falling back to saved settings."""
    settings_row = get_or_create_settings(db)
    success, message = await test_ai_connection(
        payload.gemini_api_key or settings_row.gemini_api_key,
        payload.gemini_model or settings_row.gemini_model,
    )
    return TestResult(success=success, message=message)


@router.post("/test-voice", response_model=TestResult)
async def test_voice_route(
    payload: TestVoiceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test Vapi + ElevenLabs connectivity - uses the request's values, falling back to saved settings."""
    settings_row = get_or_create_settings(db)
    success, message = await test_voice_connection(
        payload.vapi_api_key or settings_row.vapi_api_key,
        payload.elevenlabs_api_key or settings_row.elevenlabs_api_key,
        payload.elevenlabs_voice_id or settings_row.elevenlabs_voice_id,
    )
    return TestResult(success=success, message=message)


@router.post("/test-telephony", response_model=TestResult)
async def test_telephony_route(
    payload: TestTelephonyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test the telephony provider's credentials - uses the request's values, falling back to saved settings."""
    settings_row = get_or_create_settings(db)
    success, message = await test_telephony_connection(
        payload.telephony_provider or settings_row.telephony_provider,
        payload.telephony_account_id or settings_row.telephony_account_id,
        payload.telephony_auth_token or settings_row.telephony_auth_token,
    )
    return TestResult(success=success, message=message)
