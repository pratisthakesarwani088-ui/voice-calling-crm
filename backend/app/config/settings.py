"""
Application configuration.

All configuration is read from environment variables (via a local .env file
in development, or Render's Environment settings in production). Nothing
in this module is hardcoded — this keeps the project safe to commit to
GitHub and identical to run locally or on Render.

Usage:
    from app.config.settings import settings
    settings.DATABASE_URL
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ------------------------------------------------------------------
    # Core application settings
    # ------------------------------------------------------------------
    APP_NAME: str = "AI Voice Calling CRM"
    APP_ENV: str = "development"          # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ------------------------------------------------------------------
    # Database (MySQL)
    # ------------------------------------------------------------------
    # Full SQLAlchemy connection string, e.g.:
    # mysql+pymysql://user:password@host:3306/database_name
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/ai_voice_crm"

    # ------------------------------------------------------------------
    # Security / JWT (used by the Authentication module)
    # ------------------------------------------------------------------
    SECRET_KEY: str = "change-me-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    # Comma-separated list of allowed origins, e.g.:
    # "http://localhost:5173,https://your-frontend.onrender.com"
    CORS_ORIGINS: str = "http://localhost:5173"

    # ------------------------------------------------------------------
    # File storage
    # ------------------------------------------------------------------
    UPLOAD_DIR: str = "uploads"

    # ------------------------------------------------------------------
    # Gemini AI (Module 8) — used by app/services/ai_service.py
    # ------------------------------------------------------------------
    # Leave GEMINI_API_KEY unset in development if you don't have a key —
    # the AI endpoints fail gracefully with a clear "not configured"
    # error instead of the app crashing on startup.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_TIMEOUT_SECONDS: float = 60.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 1024
    GEMINI_TEMPERATURE: float = 0.4

    # ------------------------------------------------------------------
    # Voice Calling — Vapi + ElevenLabs (Module 9)
    # ------------------------------------------------------------------
    # Real Call mode only — leave these unset to use Demo Call mode,
    # which never contacts either service. Vapi orchestrates the actual
    # phone call (telephony + speech-to-text + the LLM turn) and is
    # configured here to use ElevenLabs as its text-to-speech voice
    # provider, which is the standard way these two services combine —
    # our backend calls Vapi's API only; Vapi calls ElevenLabs internally
    # using the voice id below.
    VAPI_API_KEY: str = ""
    VAPI_API_BASE_URL: str = "https://api.vapi.ai"
    VAPI_PHONE_NUMBER_ID: str = ""
    VAPI_TIMEOUT_SECONDS: float = 20.0
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = ""

    # Hard cap on actual call duration (Demo and Real alike) — not an
    # API request timeout (see GEMINI_TIMEOUT_SECONDS above for that).
    # For Real calls this is passed to Vapi so *it* ends the call at
    # this many seconds; for Demo calls it bounds the simulated
    # duration the same way. One shared value so both modes agree on
    # what "the call length limit" means.
    MAX_CALL_DURATION_SECONDS: int = 60

    # Optional shared secret Vapi should send back on webhook requests
    # (e.g. as a header) so app/routes/calls.py can reject anything
    # that didn't actually come from Vapi. Leave blank to accept any
    # webhook call — acceptable for development, not for production.
    VAPI_WEBHOOK_SECRET: str = ""

    # This backend's own publicly reachable URL (e.g. your Render
    # service URL), used to tell Vapi where to POST webhook events.
    # Leave blank for local development (no public URL to give Vapi) —
    # Real calls still work via polling alone, just without the faster
    # webhook path.
    PUBLIC_BASE_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS_ORIGINS as a clean list of origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_gemini_configured(self) -> bool:
        """Whether a Gemini API key has been set — used to fail fast with a clear error instead of a confusing upstream 401."""
        return bool(self.GEMINI_API_KEY.strip())

    @property
    def is_voice_calling_configured(self) -> bool:
        """Whether Real Call mode has everything it needs — Vapi's key, a phone number id, and an ElevenLabs voice id."""
        return bool(
            self.VAPI_API_KEY.strip()
            and self.VAPI_PHONE_NUMBER_ID.strip()
            and self.ELEVENLABS_API_KEY.strip()
            and self.ELEVENLABS_VOICE_ID.strip()
        )


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor.

    lru_cache ensures the .env file / environment is only read once per
    process, instead of on every import.
    """
    return Settings()


settings = get_settings()
