"""
Logging configuration (Module 12).

Stdlib `logging` only - no new dependency. Level follows the existing
DEBUG setting (already environment-driven, see app/config/settings.py):
verbose in development, quieter in production. Called once at app
startup from app/main.py.
"""

import logging

from app.config.settings import settings


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    # Quiet down noisy third-party loggers so app-level logs aren't drowned out.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
