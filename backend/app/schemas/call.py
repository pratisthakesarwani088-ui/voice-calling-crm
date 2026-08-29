"""
Voice Calling request/response schemas.

`CallOut` includes a few denormalized display fields (`customer_name`,
`customer_phone`, `product_name`) alongside the raw ids - the Module 9
spec explicitly wants "Customer Name" and "Phone Number" shown during
a call, and building them from the already-loaded `Call.customer` /
`Call.product` relationships (see app/routes/calls.py) avoids the
frontend needing a second round-trip just to display them.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CallMode, CallSentiment, CallStatus, CallType

CALLS_DEFAULT_PAGE_SIZE = 10
CALLS_MAX_PAGE_SIZE = 100


class CallStartRequest(BaseModel):
    """Payload for POST /calls/start."""

    customer_id: int = Field(..., gt=0)
    product_id: int = Field(..., gt=0)
    mode: CallMode


class CallOut(BaseModel):
    """Public-facing representation of a Call row, with display-friendly extras."""

    id: int
    customer_id: int
    customer_name: str
    customer_phone: str
    product_id: int | None
    product_name: str | None
    call_type: CallType
    mode: CallMode
    status: CallStatus
    duration: int | None
    recording_url: str | None
    transcript: str | None
    ai_summary: str | None
    sentiment: CallSentiment
    started_at: datetime
    ended_at: datetime | None


class CallListResponse(BaseModel):
    """
    Response for GET /calls.

    `total`/`page`/`page_size`/`total_pages` support Module 10's Call
    History pagination; Module 9's small "recent calls" widget on the
    Voice Calling page only reads `items` and ignores the rest, so
    adding these fields here doesn't change that existing behavior.
    """

    items: list[CallOut]
    total: int
    page: int
    page_size: int
    total_pages: int
