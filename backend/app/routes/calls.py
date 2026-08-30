"""
Voice Calling & Call History routes.

JWT-protected via get_current_user, same as every other business
route. Thin: validates via Pydantic, calls the orchestration service,
and maps exceptions to HTTP responses. No call logic lives here.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.call import Call
from app.models.enums import CallMode, CallStatus
from app.models.user import User
from app.schemas.call import (
    CALLS_DEFAULT_PAGE_SIZE,
    CALLS_MAX_PAGE_SIZE,
    CallListResponse,
    CallOut,
    CallStartRequest,
)
from app.schemas.common import MessageResponse
from app.services.call_service import (
    CallSortOption,
    end_call,
    get_call_by_id,
    handle_vapi_webhook,
    list_calls,
    refresh_call_status,
    soft_delete_call,
    start_demo_call,
    start_real_call,
    total_pages_for,
)
from app.utils.exceptions import (
    AIConfigurationError,
    AIServiceError,
    AITimeoutError,
    CallNotFoundError,
    CustomerNotFoundError,
    ProductNotFoundError,
    VoiceCallConfigurationError,
    VoiceCallServiceError,
    VoiceCallTimeoutError,
)

router = APIRouter(prefix="/calls", tags=["Voice Calling"])


def call_to_out(call: Call) -> CallOut:
    """
    Build the display-friendly response from an already-loaded Call row.

    Public (not underscore-prefixed) so app/routes/reports.py can reuse
    it for "Recent Call Activity" instead of re-deriving CallOut fields.

    Relies on Call.customer / Call.product being loaded within the
    current session (they are - every service function above returns
    a Call fetched or created in this same request's session, so the
    relationships lazy-load without a second explicit query).
    """
    return CallOut(
        id=call.id,
        customer_id=call.customer_id,
        customer_name=call.customer.full_name,
        customer_phone=call.customer.phone,
        product_id=call.product_id,
        product_name=call.product.product_name if call.product else None,
        call_type=call.call_type,
        mode=call.mode,
        status=call.status,
        duration=call.duration,
        recording_url=call.recording_url,
        transcript=call.transcript,
        ai_summary=call.ai_summary,
        sentiment=call.sentiment,
        started_at=call.started_at,
        ended_at=call.ended_at,
    )


@router.post("/start", response_model=CallOut, status_code=status.HTTP_201_CREATED)
async def start_call_route(
    payload: CallStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start a call - Demo (fully simulated, powered by Gemini) or Real
    (placed via Vapi, voiced by ElevenLabs). Both are grounded in the
    same database context Module 8's Ask AI uses.
    """
    try:
        if payload.mode == CallMode.DEMO:
            call = await start_demo_call(
                db, customer_id=payload.customer_id, product_id=payload.product_id
            )
        else:
            call = await start_real_call(
                db, customer_id=payload.customer_id, product_id=payload.product_id
            )
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (AIConfigurationError, VoiceCallConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except (AITimeoutError, VoiceCallTimeoutError) as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    except (AIServiceError, VoiceCallServiceError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    return call_to_out(call)


@router.post("/webhook/vapi", include_in_schema=False)
async def vapi_webhook_route(request: Request, db: Session = Depends(get_db)):
    """
    Receives Vapi's call-status/end-of-call events and updates the
    matching Call row (matched by external_call_id) — the real-time
    complement to the frontend's GET /{call_id}/status polling, so a
    call's final status/transcript/recording/duration land as soon as
    Vapi reports them rather than waiting for the next poll.

    No JWT here — Vapi is an external caller, not our authenticated
    frontend. If VAPI_WEBHOOK_SECRET is set, requests must include a
    matching X-Vapi-Secret header; unset (development default) accepts
    any request, same "leave blank to disable" pattern as every other
    optional credential in this project's settings.

    Always returns 200 (even for a call id we don't recognize, or a
    malformed body) — Vapi retries on non-2xx responses, and there's
    nothing to retry here since we've already done everything possible
    with what was sent.
    """
    if settings.VAPI_WEBHOOK_SECRET:
        if request.headers.get("X-Vapi-Secret") != settings.VAPI_WEBHOOK_SECRET:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret.")

    try:
        payload = await request.json()
    except Exception:
        return {"received": True}

    handle_vapi_webhook(db, payload)
    return {"received": True}


@router.get("/{call_id}", response_model=CallOut)
def get_call_route(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single call's current saved state."""
    try:
        call = get_call_by_id(db, call_id)
    except CallNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return call_to_out(call)


@router.get("/{call_id}/status", response_model=CallOut)
async def get_call_status_route(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Live status for an in-progress Real call - the frontend polls this
    periodically to update the lifecycle UI. For a Demo call (already
    complete the moment it's created) or an already-finalized Real
    call, this just returns the stored record unchanged.
    """
    try:
        call = await refresh_call_status(db, call_id)
    except CallNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VoiceCallConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except VoiceCallTimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    except VoiceCallServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    return call_to_out(call)


@router.post("/{call_id}/end", response_model=CallOut)
async def end_call_route(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually finalize a call (hang up)."""
    try:
        call = await end_call(db, call_id)
    except CallNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return call_to_out(call)


@router.get("", response_model=CallListResponse)
def list_calls_route(
    customer_id: int | None = Query(default=None, gt=0),
    search: str | None = Query(default=None, description="Matches customer name or phone"),
    mode: CallMode | None = Query(default=None),
    call_status: CallStatus | None = Query(default=None, alias="status"),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    sort: CallSortOption = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int | None = Query(default=None, ge=1, le=CALLS_MAX_PAGE_SIZE),
    limit: int = Query(
        default=CALLS_DEFAULT_PAGE_SIZE,
        ge=1,
        le=50,
        description="Legacy alias for page_size, kept for the Voice Calling page's recent-calls widget (Module 9)",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calls list — search/filter/paginated (Module 10's Call History), or
    a simple recent-calls fetch when only `customer_id`/`limit` are
    given (Module 9's Voice Calling page widget, unchanged behavior).
    `page_size` takes priority over `limit` when both are supplied.
    """
    effective_page_size = page_size if page_size is not None else limit

    calls, total = list_calls(
        db,
        customer_id=customer_id,
        search=search,
        mode=mode,
        status_filter=call_status,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=effective_page_size,
    )
    return CallListResponse(
        items=[call_to_out(call) for call in calls],
        total=total,
        page=page,
        page_size=effective_page_size,
        total_pages=total_pages_for(total, effective_page_size),
    )


@router.delete("/{call_id}", response_model=MessageResponse)
def delete_call_route(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a call (Module 10). The row is never removed from the database."""
    try:
        soft_delete_call(db, call_id)
    except CallNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return MessageResponse(message="Call deleted successfully.")
