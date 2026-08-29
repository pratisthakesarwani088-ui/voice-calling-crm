"""
Knowledge Base request/response schemas.

`keywords` is accepted/returned as a list of strings for a clean API,
even though it's stored as a single comma-separated column (see
app/models/knowledge_base.py and app/services/knowledge_service.py for
the conversion) — callers of this API never need to know the storage
detail.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import KnowledgeBasePriority, KnowledgeBaseStatus
from app.utils.validators import validate_required_text

KNOWLEDGE_DEFAULT_PAGE_SIZE = 10
KNOWLEDGE_MAX_PAGE_SIZE = 100


class KnowledgeWriteBase(BaseModel):
    """Shared, reusable fields + validation for Create and Update."""

    keywords: list[str] = Field(default_factory=list)
    priority: KnowledgeBasePriority = KnowledgeBasePriority.MEDIUM
    status: KnowledgeBaseStatus = KnowledgeBaseStatus.DRAFT

    @field_validator("keywords", mode="before")
    @classmethod
    def normalize_keywords(cls, value):
        """Accept either a list or a comma-separated string; always trim and drop blanks."""
        if value is None:
            return []
        if isinstance(value, str):
            value = value.split(",")
        return [item.strip() for item in value if item and item.strip()]


class KnowledgeCreate(KnowledgeWriteBase):
    """Payload for POST /knowledge-base (the Add Knowledge form)."""

    product_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=200)
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(..., min_length=1, max_length=5000)
    category: str = Field(..., min_length=1, max_length=100)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return validate_required_text(value, "Title", max_length=200)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        return validate_required_text(value, "Question", max_length=2000)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: str) -> str:
        return validate_required_text(value, "Answer", max_length=5000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return validate_required_text(value, "Category", max_length=100)


class KnowledgeUpdate(KnowledgeCreate):
    """Payload for PUT /knowledge-base/{id} (the Edit Knowledge form). Full-form save."""

    pass


class KnowledgeOut(BaseModel):
    """Public-facing representation of a Knowledge Base entry."""

    id: int
    product_id: int
    title: str
    question: str
    answer: str
    keywords: list[str]
    category: str
    priority: KnowledgeBasePriority
    status: KnowledgeBaseStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("keywords", mode="before")
    @classmethod
    def split_stored_keywords(cls, value):
        """Convert the stored comma-separated string back into a list for the API response."""
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


class KnowledgeListResponse(BaseModel):
    """Paginated list response for GET /knowledge-base."""

    items: list[KnowledgeOut]
    total: int
    page: int
    page_size: int
    total_pages: int
