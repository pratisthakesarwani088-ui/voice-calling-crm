"""
Customer Management routes.

Every route requires a valid JWT (Depends(get_current_user)) — since
this CRM is single-admin (see Module 3), any authenticated user IS the
admin, so no separate role check is needed on top of that. Thin routes
only: validate via Pydantic, call the service, map exceptions to HTTP
responses.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.enums import CustomerStatus
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.customer import (
    CUSTOMERS_DEFAULT_PAGE_SIZE,
    CUSTOMERS_MAX_PAGE_SIZE,
    CustomerCreate,
    CustomerListResponse,
    CustomerOut,
    CustomerUpdate,
)
from app.services.customer_service import (
    SortOption,
    create_customer,
    export_customers_csv,
    get_customer_by_id,
    list_customers,
    soft_delete_customer,
    total_pages_for,
    update_customer,
)
from app.utils.exceptions import CustomerNotFoundError, DuplicatePhoneError

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer_route(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new customer. customer_code is generated automatically."""
    try:
        customer = create_customer(db, payload)
    except DuplicatePhoneError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return CustomerOut.model_validate(customer)


@router.get("", response_model=CustomerListResponse)
def list_customers_route(
    search: str | None = Query(default=None, description="Matches name, phone, email, or company"),
    status_filter: CustomerStatus | None = Query(default=None, alias="status"),
    city: str | None = Query(default=None),
    state: str | None = Query(default=None),
    sort: SortOption = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=CUSTOMERS_DEFAULT_PAGE_SIZE, ge=1, le=CUSTOMERS_MAX_PAGE_SIZE
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List customers with search, filter, sort, and pagination.

    Soft-deleted customers are always excluded — this is the only view
    of the customers table the API exposes.
    """
    rows, total = list_customers(
        db,
        search=search,
        status_filter=status_filter,
        city=city,
        state=state,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return CustomerListResponse(
        items=[CustomerOut.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages_for(total, page_size),
    )


@router.get("/export")
def export_customers_route(
    search: str | None = Query(default=None),
    status_filter: CustomerStatus | None = Query(default=None, alias="status"),
    city: str | None = Query(default=None),
    state: str | None = Query(default=None),
    sort: SortOption = Query(default="newest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download all customers matching the current search/filter as a
    CSV. Registered before /{customer_id} so "export" is never matched
    as a customer_id path parameter.
    """
    content = export_customers_csv(
        db, search=search, status_filter=status_filter, city=city, state=state, sort=sort
    )
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="customers_export.csv"'},
    )


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single customer's full details (used by the View modal)."""
    try:
        customer = get_customer_by_id(db, customer_id)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return CustomerOut.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer_route(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a customer's details (used by the Edit form)."""
    try:
        customer = update_customer(db, customer_id, payload)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DuplicatePhoneError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return CustomerOut.model_validate(customer)


@router.delete("/{customer_id}", response_model=MessageResponse)
def delete_customer_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-delete a customer. The row is never removed from the database —
    it's just excluded from every list/get response from this point on.
    """
    try:
        soft_delete_customer(db, customer_id)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return MessageResponse(message="Customer deleted successfully.")
