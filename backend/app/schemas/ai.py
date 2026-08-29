"""
AI request/response schemas.

`AIAskResponse` reuses the existing `CustomerOut`/`ProductOut` schemas
from Module 5/6 (imported, not redefined) for the product/customer it
returns, and includes which Knowledge Base entries were used as context
— showing the admin what grounded the answer is good practice for an
AI feature that must "generate responses only from database data," and
gives them a way to sanity-check it against real records.
"""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.customer import CustomerOut
from app.schemas.product import ProductOut


class AIAskRequest(BaseModel):
    """Payload for POST /ai/ask."""

    question: str = Field(..., min_length=3, max_length=2000)
    product_id: int = Field(..., gt=0)
    customer_id: int | None = Field(default=None, gt=0)


class AIKnowledgeSourceOut(BaseModel):
    """A lightweight view of a Knowledge Base entry, for the sources list."""

    id: int
    title: str
    category: str

    model_config = ConfigDict(from_attributes=True)


class AIAskResponse(BaseModel):
    """Response for POST /ai/ask."""

    answer: str
    product: ProductOut
    customer: CustomerOut | None
    knowledge_sources: list[AIKnowledgeSourceOut]
