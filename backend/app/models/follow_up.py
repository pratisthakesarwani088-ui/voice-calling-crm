"""
FollowUp model.

Tracks a scheduled follow-up action for a customer (e.g. "call back
next Tuesday"). Only the data shape is defined here — reminder/
notification logic belongs to a later module.
"""

from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import CreatedAtMixin, IDMixin
from app.models.enums import FollowUpStatus, sa_enum


class FollowUp(Base, IDMixin, CreatedAtMixin):
    """
    A scheduled follow-up tied to a customer.

    Uses `CreatedAtMixin` only (per the Module 2 spec, this table has
    `created_at` but no `updated_at`) — follow-ups are expected to be
    superseded by a new row rather than edited in place, in later
    modules.
    """

    __tablename__ = "follow_ups"
    __table_args__ = (
        Index("ix_follow_ups_customer_date", "customer_id", "followup_date"),
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    followup_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    status: Mapped[FollowUpStatus] = mapped_column(
        sa_enum(FollowUpStatus),
        default=FollowUpStatus.PENDING,
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="follow_ups")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<FollowUp id={self.id} customer_id={self.customer_id} date={self.followup_date}>"
