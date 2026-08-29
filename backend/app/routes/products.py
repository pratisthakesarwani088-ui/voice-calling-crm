"""
Product Management routes. Mirrors app/routes/customers.py's structure
and conventions exactly. JWT-protected via get_current_user, same as
every other business route in this project.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.enums import ProductAvailability
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.product import (
    PRODUCTS_DEFAULT_PAGE_SIZE,
    PRODUCTS_MAX_PAGE_SIZE,
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
)
from app.services.product_service import (
    SortOption,
    create_product,
    get_product_by_id,
    list_products,
    soft_delete_product,
    total_pages_for,
    update_product,
)
from app.utils.exceptions import DuplicateSkuError, ProductNotFoundError

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product_route(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product. product_code and final_price are generated automatically."""
    try:
        product = create_product(db, payload)
    except DuplicateSkuError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return ProductOut.model_validate(product)


@router.get("", response_model=ProductListResponse)
def list_products_route(
    search: str | None = Query(default=None, description="Matches name, brand, category, or SKU"),
    category: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    availability: ProductAvailability | None = Query(default=None),
    sort: SortOption = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PRODUCTS_DEFAULT_PAGE_SIZE, ge=1, le=PRODUCTS_MAX_PAGE_SIZE
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List products with search, filter, sort, and pagination. Soft-deleted products are always excluded."""
    rows, total = list_products(
        db,
        search=search,
        category=category,
        brand=brand,
        availability=availability,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return ProductListResponse(
        items=[ProductOut.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages_for(total, page_size),
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product_route(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single product's full details (used by the View modal)."""
    try:
        product = get_product_by_id(db, product_id)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return ProductOut.model_validate(product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product_route(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a product's details (used by the Edit form)."""
    try:
        product = update_product(db, product_id, payload)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DuplicateSkuError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return ProductOut.model_validate(product)


@router.delete("/{product_id}", response_model=MessageResponse)
def delete_product_route(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a product. The row is never removed from the database."""
    try:
        soft_delete_product(db, product_id)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return MessageResponse(message="Product deleted successfully.")
