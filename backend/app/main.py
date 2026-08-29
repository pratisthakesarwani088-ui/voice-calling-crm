"""
AI Voice Calling CRM — Backend entrypoint.

Wires up the FastAPI app, middleware, and routes. Module 1 provided the
health check; Module 3 added authentication; Module 5 added Customer
Management; Module 6 added Product Management and Knowledge Base
Management; Module 7 added bulk CSV/Excel import for all three; Module 8
added a Gemini-powered AI Assistant grounded in that data; Module 9 added
Hybrid Voice Calling (Demo simulation + Real calls via Vapi/ElevenLabs);
Module 10 added Call History and Reports; Module 11 added Settings
(company/AI/voice/telephony config, change password, connectivity tests);
Module 12 adds the telephony provider abstraction, request logging, and
a global exception handler for production readiness.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.middleware.cors import add_cors_middleware
from app.middleware.logging import add_request_logging_middleware
from app.routes import ai, auth, calls, customers, dashboard, health, imports, knowledge_base, products, reports
from app.routes import settings as settings_routes
from app.utils.logging_config import configure_logging

configure_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered CRM for managing customers and AI outbound voice calls.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Middleware
add_cors_middleware(app)
add_request_logging_middleware(app)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catches anything that isn't already a handled HTTPException (those
    keep working exactly as before via FastAPI's own default handler —
    this only fires for genuinely unexpected errors). Logs the full
    traceback server-side; the client only ever sees a generic message,
    never internal details, regardless of DEBUG.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


# Routes
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(customers.router, prefix=settings.API_V1_PREFIX)
app.include_router(products.router, prefix=settings.API_V1_PREFIX)
app.include_router(knowledge_base.router, prefix=settings.API_V1_PREFIX)
app.include_router(imports.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(calls.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_routes.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint — confirms the API is running."""
    return {
        "message": f"{settings.APP_NAME} API is running.",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
