"""
Report model.

Stores a record of each generated report (who generated it, what type,
and when). The actual report-generation logic and any UI for viewing
reports belong to a later module — Module 2 only persists the metadata
row.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import IDMixin, utcnow
from app.models.enums import ReportType, sa_enum


class Report(Base, IDMixin):
    """
    A generated report's metadata.

    No soft-delete: reports are an audit record of "what was generated,
    when, by whom" and are not expected to be edited after creation.
    """

    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_type_generated_at", "report_type", "generated_at"),
    )

    report_type: Mapped[ReportType] = mapped_column(
        sa_enum(ReportType),
        nullable=False,
        index=True,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    # Nullable + ON DELETE SET NULL: a report should remain queryable
    # even if the user who generated it is later removed from the system.
    generated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    generated_by_user: Mapped["User"] = relationship(
        "User", back_populates="reports"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<Report id={self.id} type={self.report_type} generated_by={self.generated_by}>"
