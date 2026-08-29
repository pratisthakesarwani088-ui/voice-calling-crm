"""
Knowledge Base model.

Module 2 defined storage only. Module 6 builds the real feature on top
of it and extends the shape: every entry now links to a Product, and
Question/Answer/Keywords/Priority replace the free-form "content" field
in the actual UI/API — `content` stays in the schema (now nullable) for
migration safety, but is not read or written by Module 6's code.

AI-ready by design, per the Module 6 spec: `keywords` is a plain,
indexed, searchable text column (not a vector/embedding — those are
explicitly out of scope for this module) so a future module can add
semantic search on top without changing this table's shape again.
"""

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import BaseModel, SoftDeleteMixin
from app.models.enums import KnowledgeBasePriority, KnowledgeBaseStatus, sa_enum


class KnowledgeBase(Base, BaseModel, SoftDeleteMixin):
    """
    A single knowledge base article/entry, linked to one Product.

    Soft-delete is enabled so published entries can be retracted
    without losing authoring history.
    """

    __tablename__ = "knowledge_base"
    __table_args__ = (
        Index("ix_knowledge_base_category_status", "category", "status"),
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    # Module 6 fields — the actual Q&A content editors work with.
    question: Mapped[str] = mapped_column(Text, nullable=False)

    answer: Mapped[str] = mapped_column(Text, nullable=False)

    # Comma-separated, trimmed keywords (see app/services/knowledge_service.py
    # for normalization). Plain indexed text — deliberately not a vector/
    # embedding column; see module docstring above.
    keywords: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)

    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    priority: Mapped[KnowledgeBasePriority] = mapped_column(
        sa_enum(KnowledgeBasePriority),
        default=KnowledgeBasePriority.MEDIUM,
        nullable=False,
        index=True,
    )

    status: Mapped[KnowledgeBaseStatus] = mapped_column(
        sa_enum(KnowledgeBaseStatus),
        default=KnowledgeBaseStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Legacy Module 2 column. Nullable as of Module 6's migration; no
    # longer read or written anywhere — kept only so existing rows (if
    # any) and the migration history aren't destructively altered.
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    product: Mapped["Product"] = relationship(
        "Product", back_populates="knowledge_entries"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<KnowledgeBase id={self.id} title={self.title!r} product_id={self.product_id}>"
