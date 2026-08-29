"""
App-wide settings - a single row (id=1), edited via the Settings page.

Distinct from app.config.settings (env-var config loaded once at
startup): these are runtime-editable via the API. AI/Voice service
calls (app/services/ai_service.py, voice_call_service.py) still read
from env-var settings unchanged, per Module 11's "minimal, backward
compatible" scope - this table only backs the Settings page's view/
edit/test features, it doesn't rewire the live call pipeline.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.models.base import BaseModel
from app.models.enums import TelephonyProvider, sa_enum


class AppSettings(Base, BaseModel):
    __tablename__ = "app_settings"

    company_name: Mapped[str] = mapped_column(
        String(150), default="TechNova Electronics", nullable=False
    )
    company_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)

    gemini_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gemini_model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    vapi_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vapi_assistant_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    elevenlabs_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    elevenlabs_voice_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    telephony_provider: Mapped[TelephonyProvider] = mapped_column(
        sa_enum(TelephonyProvider), default=TelephonyProvider.TWILIO, nullable=False
    )
    # Generic names since Twilio (Account SID / Auth Token) and Exotel
    # (API Key / API Token) use differently-named credential pairs.
    telephony_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telephony_auth_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telephony_caller_number: Mapped[str | None] = mapped_column(String(30), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AppSettings id={self.id}>"
