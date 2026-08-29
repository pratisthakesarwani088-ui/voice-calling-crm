"""
Request logging middleware (Module 12).

Logs method/path/status/duration for every request - minimal
production observability, no new dependency (stdlib `logging` +
Starlette's existing BaseHTTPMiddleware). Mirrors app/middleware/cors.py's
`add_x_middleware(app)` registration pattern.
"""

import logging
import time

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.monotonic()
        response = await call_next(request)
        duration_ms = (time.monotonic() - start_time) * 1000
        logger.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


def add_request_logging_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestLoggingMiddleware)
