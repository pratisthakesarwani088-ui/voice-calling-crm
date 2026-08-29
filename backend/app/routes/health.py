"""
Health check route.

This is the only route in Module 1. It exists so we can verify that:
  1. The FastAPI app boots correctly
  2. Environment configuration loaded correctly
  3. The server is reachable (used by Render's health checks)

No business routes (auth, customers, calls, etc.) are defined here —
those belong to later modules.
"""

from fastapi import APIRouter

from app.config.settings import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Simple liveness/readiness probe."""
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }
