"""
Knowledge Base service — business logic only.

Mirrors app/services/customer_service.py and product_service.py's
structure. Every entry must link to an existing (non-deleted) product —
enforced here, not just by the database FK — so the API returns a
clean 404 for a bad product_id instead of a raw integrity error.
"""

import math
from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import KnowledgeBaseStatus
from app.models.knowledge_base import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeCreate, KnowledgeUpdate
from app.services.product_service import get_product_by_id
from app.utils.exceptions import KnowledgeEntryNotFoundError

SortOption = Literal["newest", "oldest", "name_asc", "name_desc"]


def _keywords_to_text(keywords: list[str]) -> str | None:
    """Store the normalized keyword list as a single comma-separated column."""
    return ", ".join(keywords) if keywords else None


def create_knowledge_entry(db: Session, payload: KnowledgeCreate) -> KnowledgeBase:
    """
    Create a new Knowledge Base entry linked to a product.

    Raises ProductNotFoundError (via get_product_by_id) if product_id
    doesn't reference an existing, non-deleted product.
    """
    get_product_by_id(db, payload.product_id)  # validates the link exists

    entry = KnowledgeBase(
        product_id=payload.product_id,
        title=payload.title.strip(),
        question=payload.question.strip(),
        answer=payload.answer.strip(),
        keywords=_keywords_to_text(payload.keywords),
        category=payload.category.strip(),
        priority=payload.priority,
        status=payload.status,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_knowledge_entry_by_id(db: Session, entry_id: int) -> KnowledgeBase:
    """Fetch a single non-deleted Knowledge Base entry, or raise KnowledgeEntryNotFoundError."""
    entry = db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == entry_id, KnowledgeBase.is_deleted.is_(False)
        )
    ).scalar_one_or_none()

    if entry is None:
        raise KnowledgeEntryNotFoundError(f"Knowledge base entry {entry_id} was not found.")

    return entry


def get_knowledge_entry_by_product_and_title(
    db: Session, product_id: int, title: str
) -> KnowledgeBase | None:
    """
    Look up a non-deleted Knowledge Base entry by (product_id, title).

    Added for Module 7 (Data Import): the KnowledgeBase table has no
    single unique column to detect duplicates by (unlike Customer.phone
    or Product.sku) — the import engine treats the combination of
    "which product" and "what title" as an entry's identity. Case-
    insensitive on purpose, matching how the import engine's dedup key
    normalizes titles (see app/services/import_config.py) — otherwise
    "Battery Life" and "battery life" would incorrectly be treated as
    two different entries instead of the same one. Returns None, not
    an exception.
    """
    return db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.product_id == product_id,
            KnowledgeBase.title.ilike(title.strip()),
            KnowledgeBase.is_deleted.is_(False),
        )
    ).scalar_one_or_none()


def update_knowledge_entry(
    db: Session, entry_id: int, payload: KnowledgeUpdate
) -> KnowledgeBase:
    """Update an existing Knowledge Base entry, re-validating the product link."""
    entry = get_knowledge_entry_by_id(db, entry_id)
    get_product_by_id(db, payload.product_id)  # validates the (possibly new) link

    entry.product_id = payload.product_id
    entry.title = payload.title.strip()
    entry.question = payload.question.strip()
    entry.answer = payload.answer.strip()
    entry.keywords = _keywords_to_text(payload.keywords)
    entry.category = payload.category.strip()
    entry.priority = payload.priority
    entry.status = payload.status

    db.commit()
    db.refresh(entry)
    return entry


def soft_delete_knowledge_entry(db: Session, entry_id: int) -> None:
    """Soft-delete a Knowledge Base entry — same reasoning as soft_delete_customer."""
    from app.models.base import utcnow

    entry = get_knowledge_entry_by_id(db, entry_id)
    entry.is_deleted = True
    entry.deleted_at = utcnow()
    db.commit()


def list_knowledge_entries(
    db: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    status_filter: KnowledgeBaseStatus | None = None,
    product_id: int | None = None,
    sort: SortOption = "newest",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[KnowledgeBase], int]:
    """
    List non-deleted Knowledge Base entries with search, filter, sort,
    and pagination.

    Search matches Title, Question, and Keywords — the plain-text
    columns that stand in for real semantic search until a future
    module adds it (see the model's docstring for why this is
    deliberately NOT a vector/embedding column yet).

    `product_id` is optional and additive — the Knowledge Base page
    itself never passes it (entries for every product show together
    there), but app/services/ai_context_service.py needs it to fetch
    entries scoped to one product directly at the database level,
    rather than over-fetching everything and filtering in Python.
    """
    query = select(KnowledgeBase).where(KnowledgeBase.is_deleted.is_(False))
    count_query = select(func.count()).select_from(KnowledgeBase).where(
        KnowledgeBase.is_deleted.is_(False)
    )

    if search:
        search_term = f"%{search.strip()}%"
        search_condition = or_(
            KnowledgeBase.title.ilike(search_term),
            KnowledgeBase.question.ilike(search_term),
            KnowledgeBase.keywords.ilike(search_term),
        )
        query = query.where(search_condition)
        count_query = count_query.where(search_condition)

    if category:
        category_term = f"%{category.strip()}%"
        query = query.where(KnowledgeBase.category.ilike(category_term))
        count_query = count_query.where(KnowledgeBase.category.ilike(category_term))

    if status_filter is not None:
        query = query.where(KnowledgeBase.status == status_filter)
        count_query = count_query.where(KnowledgeBase.status == status_filter)

    if product_id is not None:
        query = query.where(KnowledgeBase.product_id == product_id)
        count_query = count_query.where(KnowledgeBase.product_id == product_id)

    sort_map = {
        "newest": KnowledgeBase.created_at.desc(),
        "oldest": KnowledgeBase.created_at.asc(),
        "name_asc": KnowledgeBase.title.asc(),
        "name_desc": KnowledgeBase.title.desc(),
    }
    query = query.order_by(sort_map.get(sort, KnowledgeBase.created_at.desc()))

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
