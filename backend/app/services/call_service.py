"""
Call orchestration service - Module 9's CRM-specific layer, mirroring
app/services/ai_context_service.py's relationship to ai_service.py:
this file knows about Customers/Products/Calls; the low-level
app/services/voice_call_service.py knows nothing but how to talk to
Vapi.

Demo Call: fully local simulation. Reuses
ai_context_service.build_grounded_context (the exact same context-
building Module 8's Ask AI uses) and ai_service.generate_ai_response
to have Gemini write a realistic transcript + summary - grounded in
real database data, never a hardcoded canned response. No Vapi/
ElevenLabs call is made; nothing external happens beyond the Gemini
call already covered by Module 8.

Real Call: builds the same grounded context, then asks
voice_call_service.start_vapi_call to actually place the call, with
Vapi configured to speak using ElevenLabs. The Call row is saved
immediately with status=IN_PROGRESS and the returned external_call_id;
app/routes/calls.py exposes a status-polling endpoint the frontend
calls periodically to update the live lifecycle UI, and an /end
endpoint to finalize the row once the call is over.
"""

import math
import random
import re
from datetime import date, datetime, timedelta
from typing import Literal
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.base import utcnow
from app.models.call import Call
from app.models.customer import Customer
from app.models.enums import CallMode, CallSentiment, CallStatus, CallType
from app.services.ai_context_service import build_grounded_context
from app.services.ai_service import generate_ai_response
from app.services.voice_call_service import end_vapi_call, get_vapi_call, start_vapi_call
from app.utils.exceptions import CallNotFoundError

CallSortOption = Literal["newest", "oldest"]

DEMO_SYSTEM_INSTRUCTION = (
    "You are simulating a realistic phone call transcript for a CRM demo. You play both the "
    "TechNova Electronics AI sales/support agent AND the customer, based ONLY on the CONTEXT "
    "provided below (product details, knowledge base entries, and customer details pulled "
    "directly from the company's database). Never invent product facts, prices, or policies "
    "that aren't in the context - if the context doesn't cover something the simulated "
    "customer asks, have the agent say they'll follow up rather than making something up."
)

DEMO_PROMPT_INSTRUCTIONS = (
    "\n\nWrite a short, realistic call transcript (4-8 alternating turns) between the Agent and "
    "the Customer discussing the product above, then a one-paragraph summary, then a sentiment. "
    "Respond in EXACTLY this format, with no extra commentary:\n\n"
    "TRANSCRIPT:\n"
    "Agent: <line>\n"
    "Customer: <line>\n"
    "(continue alternating)\n\n"
    "SUMMARY:\n"
    "<one paragraph>\n\n"
    "SENTIMENT: <positive, neutral, or negative>"
)

_TRANSCRIPT_RE = re.compile(r"TRANSCRIPT:\s*(.*?)\s*SUMMARY:", re.DOTALL | re.IGNORECASE)
_SUMMARY_RE = re.compile(r"SUMMARY:\s*(.*?)\s*SENTIMENT:", re.DOTALL | re.IGNORECASE)
_SENTIMENT_RE = re.compile(r"SENTIMENT:\s*(positive|neutral|negative)", re.IGNORECASE)


def _parse_demo_response(raw_text: str) -> tuple[str, str, CallSentiment]:
    """
    Parse Gemini's structured demo-call response.

    Never raises: if the model didn't follow the requested format
    exactly (which happens with any LLM), falls back to using the
    entire raw response as both the transcript and the summary rather
    than losing the content or crashing the call.
    """
    transcript_match = _TRANSCRIPT_RE.search(raw_text)
    summary_match = _SUMMARY_RE.search(raw_text)
    sentiment_match = _SENTIMENT_RE.search(raw_text)

    transcript = transcript_match.group(1).strip() if transcript_match else raw_text.strip()
    summary = summary_match.group(1).strip() if summary_match else raw_text.strip()
    sentiment = (
        CallSentiment(sentiment_match.group(1).lower())
        if sentiment_match
        else CallSentiment.UNKNOWN
    )

    return transcript, summary, sentiment


async def start_demo_call(db: Session, *, customer_id: int, product_id: int) -> Call:
    """
    Run a complete Demo Call simulation synchronously and save the result.

    Raises ProductNotFoundError / CustomerNotFoundError if either id is
    invalid (from build_grounded_context, reused unchanged from Module 8).
    Gemini failures (AIConfigurationError / AITimeoutError / AIServiceError)
    propagate as-is - the route layer already knows how to map them
    (same exceptions Module 8's /ai/ask uses).
    """
    context_text, product, customer, _knowledge = build_grounded_context(
        db, product_id=product_id, customer_id=customer_id
    )

    prompt = context_text + DEMO_PROMPT_INSTRUCTIONS
    raw_response = await generate_ai_response(prompt, system_instruction=DEMO_SYSTEM_INSTRUCTION)
    transcript, summary, sentiment = _parse_demo_response(raw_response)

    turn_count = transcript.lower().count("agent:") + transcript.lower().count("customer:")
    # Real duration limit, not just a Gemini API timeout — see
    # settings.MAX_CALL_DURATION_SECONDS. Floor kept comfortably below
    # the cap so there's still some spread between short and long
    # simulated conversations.
    duration_seconds = max(
        20, min(settings.MAX_CALL_DURATION_SECONDS, turn_count * random.randint(3, 7))
    )

    started_at = utcnow()
    call = Call(
        customer_id=customer.id,
        product_id=product.id,
        call_type=CallType.OUTBOUND,
        mode=CallMode.DEMO,
        status=CallStatus.COMPLETED,
        duration=duration_seconds,
        transcript=transcript,
        ai_summary=summary,
        sentiment=sentiment,
        started_at=started_at,
        ended_at=started_at + timedelta(seconds=duration_seconds),
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


def _map_vapi_status(vapi_status: str | None, ended_reason: str | None) -> CallStatus:
    """
    Map Vapi's call status vocabulary to our persisted CallStatus enum.

    Vapi's own status field moves through roughly: queued -> ringing ->
    in-progress -> ended (with an endedReason explaining why). This is
    intentionally forgiving of unrecognized values (falls back to
    IN_PROGRESS) since Vapi's exact status strings can't be verified
    without a live account - see docs/voice-calling.md.
    """
    status = (vapi_status or "").lower()
    if status in ("queued", "ringing", "in-progress", "forwarding"):
        return CallStatus.IN_PROGRESS
    if status == "ended":
        reason = (ended_reason or "").lower()
        if "no-answer" in reason or "no_answer" in reason or "busy" in reason:
            return CallStatus.MISSED
        if "fail" in reason or "error" in reason:
            return CallStatus.FAILED
        return CallStatus.COMPLETED
    return CallStatus.IN_PROGRESS


async def start_real_call(db: Session, *, customer_id: int, product_id: int) -> Call:
    """
    Place a real outbound call via Vapi (voiced by ElevenLabs), grounded
    in the same database context Demo Call and Ask AI both use.

    If Vapi's call-creation request itself fails, the Call row is still
    saved with status=FAILED and the failure reason in ai_summary - a
    failed real call is still a call that happened and belongs in the
    audit trail, per Module 2's "calls are an audit/compliance trail"
    design note.
    """
    context_text, product, customer, _knowledge = build_grounded_context(
        db, product_id=product_id, customer_id=customer_id
    )

    system_prompt = (
        "You are a live phone agent for TechNova Electronics, speaking with a real customer. "
        "Answer ONLY using the CONTEXT below (product details, knowledge base entries, and "
        "customer details pulled directly from the company's database). Never invent product "
        "facts, prices, or policies that aren't in the context.\n\n" + context_text
    )
    first_message = (
        f"Hi, this is TechNova Electronics calling for {customer.full_name}. "
        "Do you have a moment?"
    )

    started_at = utcnow()
    call = Call(
        customer_id=customer.id,
        product_id=product.id,
        call_type=CallType.OUTBOUND,
        mode=CallMode.REAL,
        status=CallStatus.QUEUED,
        started_at=started_at,
    )

    try:
        vapi_call = await start_vapi_call(
            phone_number=customer.phone, system_prompt=system_prompt, first_message=first_message
        )
    except Exception as exc:
        call.status = CallStatus.FAILED
        call.ended_at = utcnow()
        call.ai_summary = f"Call failed to start: {exc}"
        db.add(call)
        db.commit()
        db.refresh(call)
        raise

    call.external_call_id = vapi_call.get("id")
    call.status = _map_vapi_status(vapi_call.get("status"), None)
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


def get_call_by_id(db: Session, call_id: int) -> Call:
    """Fetch a single non-deleted call record, or raise CallNotFoundError."""
    call = db.execute(
        select(Call).where(Call.id == call_id, Call.is_deleted.is_(False))
    ).scalar_one_or_none()
    if call is None:
        raise CallNotFoundError(f"Call {call_id} was not found.")
    return call


def soft_delete_call(db: Session, call_id: int) -> None:
    """
    Soft-delete a call (Module 10). The row — including its transcript
    and recording URL — is never removed from the database; it's just
    excluded from Call History and get-by-id from this point on. See
    the Call model's docstring for why this preserves the audit trail.
    """
    call = get_call_by_id(db, call_id)
    call.is_deleted = True
    call.deleted_at = utcnow()
    db.commit()


def _apply_vapi_update(call: Call, vapi_data: dict) -> None:
    """
    Shared update logic for both the polling path (refresh_call_status)
    and the webhook path (handle_vapi_webhook) — one place that maps a
    Vapi call payload onto our Call row, so the two paths can never
    drift out of sync with each other.
    """
    new_status = _map_vapi_status(vapi_data.get("status"), vapi_data.get("endedReason"))
    call.status = new_status
    if new_status in (CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED):
        call.ended_at = call.ended_at or utcnow()
        call.duration = call.duration or int((call.ended_at - call.started_at).total_seconds())
        if vapi_data.get("summary"):
            call.ai_summary = vapi_data["summary"]
        if vapi_data.get("transcript"):
            call.transcript = vapi_data["transcript"]
        if vapi_data.get("recordingUrl"):
            call.recording_url = vapi_data["recordingUrl"]


async def refresh_call_status(db: Session, call_id: int) -> Call:
    """
    For a Real, still-in-progress call: poll Vapi and update the saved
    row if anything changed. Demo calls (and already-finalized Real
    calls) are returned as-is - there's nothing to poll for either.

    This is the fallback path — handle_vapi_webhook() below is the
    primary, faster path when Vapi's webhook is configured; polling
    exists because a webhook delivery can be missed or the platform
    might not have a public URL for Vapi to call in every deployment.
    """
    call = get_call_by_id(db, call_id)

    if (
        call.mode != CallMode.REAL
        or call.status != CallStatus.IN_PROGRESS
        or not call.external_call_id
    ):
        return call

    vapi_call = await get_vapi_call(call.external_call_id)
    _apply_vapi_update(call, vapi_call)

    db.commit()
    db.refresh(call)
    return call


def handle_vapi_webhook(db: Session, payload: dict) -> Call | None:
    """
    Apply a Vapi webhook event to the matching Call row, found by
    external_call_id (never by our own internal id — Vapi doesn't know
    that). Returns the updated Call, or None if no call in our
    database matches the webhook's call id (e.g. a stale/duplicate
    delivery, or a call this backend never actually started).

    Vapi wraps the actual event in a top-level "message" object; this
    accepts that shape but also the bare event shape defensively, since
    the exact envelope can't be verified without a live Vapi account —
    see docs/voice-calling.md.
    """
    event = payload.get("message", payload)
    vapi_call_data = event.get("call", event)
    external_call_id = vapi_call_data.get("id")
    if not external_call_id:
        return None

    call = db.execute(
        select(Call).where(Call.external_call_id == external_call_id)
    ).scalar_one_or_none()
    if call is None:
        return None

    # A webhook can arrive for a call already finalized by polling (or
    # a duplicate delivery, which Vapi's own docs say can happen) —
    # only apply it while there's still something to update.
    if call.status not in (CallStatus.QUEUED, CallStatus.IN_PROGRESS):
        return call

    _apply_vapi_update(call, event)

    db.commit()
    db.refresh(call)
    return call


async def end_call(db: Session, call_id: int) -> Call:
    """
    Manually finalize a call - the admin hanging up, or closing out a
    call whose real end wasn't otherwise detected. For a Real call,
    also asks Vapi to end it server-side.
    """
    call = get_call_by_id(db, call_id)

    if call.status not in (CallStatus.QUEUED, CallStatus.IN_PROGRESS):
        return call  # already finalized - end_call is idempotent

    if call.mode == CallMode.REAL and call.external_call_id:
        try:
            await end_vapi_call(call.external_call_id)
        except Exception:
            # Best-effort - we still finalize our own record even if
            # telling Vapi to hang up fails (e.g. it already ended).
            pass

    call.status = CallStatus.COMPLETED
    call.ended_at = utcnow()
    call.duration = int((call.ended_at - call.started_at).total_seconds())
    db.commit()
    db.refresh(call)
    return call


def list_calls(
    db: Session,
    *,
    customer_id: int | None = None,
    search: str | None = None,
    mode: CallMode | None = None,
    status_filter: CallStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    sort: CallSortOption = "newest",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Call], int]:
    """
    Search/filter/paginated call list — powers both the Voice Calling
    page's small "recent calls" widget (Module 9, called with just
    customer_id + a small page_size) and the full Call History page
    (Module 10, using every filter). One function, no duplicated query
    logic between the two call sites — see app/routes/calls.py.

    `search` matches the linked customer's name or phone (a join, since
    Call itself has no name/phone column) — this is the same ILIKE
    "contains" search style every other list function in this project
    uses, not semantic/embedding search.
    """
    query = select(Call).join(Customer, Call.customer_id == Customer.id).where(
        Call.is_deleted.is_(False)
    )
    count_query = (
        select(func.count())
        .select_from(Call)
        .join(Customer, Call.customer_id == Customer.id)
        .where(Call.is_deleted.is_(False))
    )

    if customer_id is not None:
        query = query.where(Call.customer_id == customer_id)
        count_query = count_query.where(Call.customer_id == customer_id)

    if search:
        search_term = f"%{search.strip()}%"
        search_condition = or_(Customer.full_name.ilike(search_term), Customer.phone.ilike(search_term))
        query = query.where(search_condition)
        count_query = count_query.where(search_condition)

    if mode is not None:
        query = query.where(Call.mode == mode)
        count_query = count_query.where(Call.mode == mode)

    if status_filter is not None:
        query = query.where(Call.status == status_filter)
        count_query = count_query.where(Call.status == status_filter)

    if date_from is not None:
        query = query.where(Call.started_at >= datetime.combine(date_from, datetime.min.time()))
        count_query = count_query.where(
            Call.started_at >= datetime.combine(date_from, datetime.min.time())
        )

    if date_to is not None:
        query = query.where(Call.started_at <= datetime.combine(date_to, datetime.max.time()))
        count_query = count_query.where(
            Call.started_at <= datetime.combine(date_to, datetime.max.time())
        )

    query = query.order_by(Call.started_at.desc() if sort == "newest" else Call.started_at.asc())

    total = db.execute(count_query).scalar_one()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    rows = list(db.execute(query).scalars().all())
    return rows, total


def total_pages_for(total: int, page_size: int) -> int:
    """Shared page-count math (same as customer_service.total_pages_for)."""
    if total == 0:
        return 0
    return math.ceil(total / page_size)
