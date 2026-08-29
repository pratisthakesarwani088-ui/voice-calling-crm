"""
Knowledge Base Management routes. Mirrors app/routes/customers.py and
app/routes/products.py's structure. JWT-protected via get_current_user.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.enums import KnowledgeBaseStatus
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.knowledge_base import (
    KNOWLEDGE_DEFAULT_PAGE_SIZE,
    KNOWLEDGE_MAX_PAGE_SIZE,
    KnowledgeCreate,
    KnowledgeListResponse,
    KnowledgeOut,
    KnowledgeUpdate,
)
from app.services.knowledge_service import (
    SortOption,
    create_knowledge_entry,
    get_knowledge_entry_by_id,
    list_knowledge_entries,
    soft_delete_knowledge_entry,
    total_pages_for,
    update_knowledge_entry,
)
from app.utils.exceptions import KnowledgeEntryNotFoundError, ProductNotFoundError

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])


@router.post("", response_model=KnowledgeOut, status_code=status.HTTP_201_CREATED)
def create_knowledge_entry_route(
    payload: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new Knowledge Base entry, linked to an existing product."""
    try:
        entry = create_knowledge_entry(db, payload)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return KnowledgeOut.model_validate(entry)


@router.get("", response_model=KnowledgeListResponse)
def list_knowledge_entries_route(
    search: str | None = Query(default=None, description="Matches title, question, or keywords"),
    category: str | None = Query(default=None),
    status_filter: KnowledgeBaseStatus | None = Query(default=None, alias="status"),
    sort: SortOption = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=KNOWLEDGE_DEFAULT_PAGE_SIZE, ge=1, le=KNOWLEDGE_MAX_PAGE_SIZE
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List Knowledge Base entries with search, filter, sort, and pagination."""
    rows, total = list_knowledge_entries(
        db,
        search=search,
        category=category,
        status_filter=status_filter,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return KnowledgeListResponse(
        items=[KnowledgeOut.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages_for(total, page_size),
    )


@router.get("/{entry_id}", response_model=KnowledgeOut)
def get_knowledge_entry_route(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single Knowledge Base entry's full details (used by the View modal)."""
    try:
        entry = get_knowledge_entry_by_id(db, entry_id)
    except KnowledgeEntryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return KnowledgeOut.model_validate(entry)


@router.put("/{entry_id}", response_model=KnowledgeOut)
def update_knowledge_entry_route(
    entry_id: int,
    payload: KnowledgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a Knowledge Base entry (used by the Edit form)."""
    try:
        entry = update_knowledge_entry(db, entry_id, payload)
    except KnowledgeEntryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return KnowledgeOut.model_validate(entry)


@router.delete("/{entry_id}", response_model=MessageResponse)
def delete_knowledge_entry_route(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a Knowledge Base entry. The row is never removed from the database."""
    try:
        soft_delete_knowledge_entry(db, entry_id)
    except KnowledgeEntryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return MessageResponse(message="Knowledge base entry deleted successfully.")
