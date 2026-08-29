"""
Shared model building blocks.

Every table in this project inherits from `Base` (the SQLAlchemy
declarative base defined in app.database.session) plus one or more of
the mixins below, so common columns (id, timestamps, soft-delete) are
defined once instead of being copy-pasted into every model file.

All timestamps are stored in UTC. MySQL's DATETIME has no timezone
awareness, so we standardize on "always UTC, converted at the edges"
rather than relying on TIMESTAMP + server timezone settings, which is
what keeps this predictable across local dev, CI, and Render.
"""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    """Timezone-aware current UTC time, used as a default for timestamp columns."""
    return datetime.now(timezone.utc)


class IDMixin:
    """
    Auto-incrementing BigInteger primary key.

    BigInteger (not Integer) is used so IDs don't risk overflowing once
    call/transcript volume grows — cheap to choose correctly now, painful
    to migrate later.
    """

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )


class TimestampMixin:
    """created_at / updated_at columns, both stored in UTC."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class CreatedAtMixin:
    """
    `created_at` only, no `updated_at`.

    Used by tables that are effectively append-only / log-like (e.g.
    FollowUp) where the spec calls for a creation timestamp but the row
    isn't expected to be edited in place, so an `updated_at` column
    would just sit unused.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class SoftDeleteMixin:
    """
    Soft-delete support.

    `is_deleted` + `deleted_at` let records be hidden from normal queries
    without losing history (needed for customers/calls, which later
    modules will report on). Actual query filtering (e.g. a default
    `WHERE is_deleted = false`) is applied in the service layer in a
    future module — Module 2 only defines the columns.
    """

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class BaseModel(IDMixin, TimestampMixin):
    """
    Standard combination used by most tables: id + created_at/updated_at.

    Use this directly for tables that don't need soft delete (e.g.
    FollowUp, Report), and combine `IDMixin, TimestampMixin,
    SoftDeleteMixin` directly for tables that do (Customers, Calls,
    KnowledgeBase) — see each model file for which mixins it uses.
    """

    pass
