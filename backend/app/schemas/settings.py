"""
Settings request/response schemas.

Sensitive fields (API keys, tokens) are masked in SettingsOut (see
app/services/settings_service.py:mask_secret) and, on update, a masked
placeholder value is treated as "unchanged" rather than overwritten -
so the frontend can safely display+resubmit the form without leaking
or clobbering secrets it never received in full.
"""

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import TelephonyProvider
from app.utils.validators import validate_password_strength


class SettingsOut(BaseModel):
    company_name: str
    company_logo_url: str | None
    timezone: str
    gemini_api_key: str | None
    gemini_model: str | None
    vapi_api_key: str | None
    vapi_assistant_id: str | None
    elevenlabs_api_key: str | None
    elevenlabs_voice_id: str | None
    telephony_provider: TelephonyProvider
    telephony_account_id: str | None
    telephony_auth_token: str | None
    telephony_caller_number: str | None


class SettingsUpdate(BaseModel):
    """Partial update - only fields provided (non-None) are applied."""

    company_name: str | None = Field(default=None, max_length=150)
    company_logo_url: str | None = Field(default=None, max_length=500)
    timezone: str | None = Field(default=None, max_length=50)
    gemini_api_key: str | None = None
    gemini_model: str | None = Field(default=None, max_length=100)
    vapi_api_key: str | None = None
    vapi_assistant_id: str | None = Field(default=None, max_length=100)
    elevenlabs_api_key: str | None = None
    elevenlabs_voice_id: str | None = Field(default=None, max_length=100)
    telephony_provider: TelephonyProvider | None = None
    telephony_account_id: str | None = None
    telephony_auth_token: str | None = None
    telephony_caller_number: str | None = Field(default=None, max_length=30)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password do not match.")
        return self


class TestAIRequest(BaseModel):
    gemini_api_key: str | None = None
    gemini_model: str | None = None


class TestVoiceRequest(BaseModel):
    vapi_api_key: str | None = None
    elevenlabs_api_key: str | None = None
    elevenlabs_voice_id: str | None = None


class TestTelephonyRequest(BaseModel):
    telephony_provider: TelephonyProvider | None = None
    telephony_account_id: str | None = None
    telephony_auth_token: str | None = None


class TestResult(BaseModel):
    success: bool
    message: str
