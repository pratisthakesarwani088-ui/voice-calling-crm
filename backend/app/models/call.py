"""
Call model.

Stores one row per AI voice call — inbound or outbound — including the
recording URL, transcript, and AI-generated summary/sentiment. Module 2
defined storage only; Module 9 (Hybrid Voice Calling) is the engine
that actually writes rows here, and added `mode`, `product_id`, and
`external_call_id` on top of the original Module 2 shape. Module 10
(Call History & Reports) adds soft-delete, since it explicitly requires
a "Delete Call (soft delete)" action that Module 9 didn't need.

Uses `started_at` / `ended_at` (rather than the generic created_at /
updated_at pair) since those are the timestamps that actually matter for
a call record, per the Module 2 spec.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import IDMixin, SoftDeleteMixin, utcnow
from app.models.enums import CallMode, CallSentiment, CallStatus, CallType, sa_enum


class Call(Base, IDMixin, SoftDeleteMixin):
    """
    A single voice call record tied to a customer, and optionally to a
    product (Module 9 — used to ground the AI's context for that call,
    the same way Module 8's Ask AI grounds a question in a product).

    Soft-delete only (Module 10) — calls remain a full audit/compliance
    trail even after "deletion": a deleted call is hidden from the Call
    History list but the row (and its transcript/recording) is never
    actually removed, and reports still have access to it if ever
    needed for compliance. This mirrors Customer/Product/KnowledgeBase's
    soft-delete reasoning exactly.
    """

    __tablename__ = "calls"
    __table_args__ = (
        Index("ix_calls_customer_started", "customer_id", "started_at"),
        Index("ix_calls_status_type", "status", "call_type"),
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Nullable + ON DELETE SET NULL (not CASCADE, unlike customer_id):
    # a call record is historical and must survive even if the product
    # it was grounded in is later deleted — same reasoning as
    # Report.generated_by in Module 2.
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    call_type: Mapped[CallType] = mapped_column(
        sa_enum(CallType),
        nullable=False,
        index=True,
    )

    # Module 9: was this a local Demo simulation or a Real Vapi/ElevenLabs call?
    mode: Mapped[CallMode] = mapped_column(
        sa_enum(CallMode),
        default=CallMode.DEMO,
        nullable=False,
        index=True,
    )

    status: Mapped[CallStatus] = mapped_column(
        sa_enum(CallStatus),
        default=CallStatus.QUEUED,
        nullable=False,
        index=True,
    )

    # Call duration in seconds. Nullable until the call completes.
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    recording_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)

    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    sentiment: Mapped[CallSentiment] = mapped_column(
        sa_enum(CallSentiment),
        default=CallSentiment.UNKNOWN,
        nullable=False,
        index=True,
    )

    # Module 9: Vapi's call id, for a Real call only — used to poll
    # Vapi for live status updates. Always NULL for Demo calls, which
    # never talk to Vapi at all.
    external_call_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="calls")
    product: Mapped["Product"] = relationship("Product")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<Call id={self.id} customer_id={self.customer_id} status={self.status}>"
