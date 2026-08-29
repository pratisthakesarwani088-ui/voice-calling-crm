"""
Product service — business logic only.

Mirrors app/services/customer_service.py's structure and conventions.
Framework-agnostic; routes (app/routes/products.py) map its exceptions
to HTTP responses.
"""

import math
from decimal import Decimal
from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.base import utcnow
from app.models.enums import ProductAvailability
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.code_generator import generate_sequential_code
from app.utils.exceptions import DuplicateSkuError, ProductNotFoundError

PRODUCT_CODE_PREFIX = "PRD"
PRODUCT_CODE_DIGITS = 6

SortOption = Literal["newest", "oldest", "name_asc", "name_desc"]


def compute_final_price(price: Decimal, discount: Decimal) -> Decimal:
    """
    The one place final_price is computed — price minus discount,
    floored at 0. Never accepted directly from client input (see
    app/schemas/product.py), so it can never drift from the two values
    it's derived from.
    """
    final = price - discount
    return final if final > 0 else Decimal("0")


def _check_sku_available(db: Session, sku: str, exclude_product_id: int | None = None) -> None:
    """
    Raise DuplicateSkuError if `sku` is already taken.

    Checked against ALL rows, including soft-deleted ones — mirrors
    customer_service._check_phone_available's reasoning: a deleted
    product's SKU can never be reassigned to a new product.
    """
    query = select(Product.id).where(Product.sku == sku)
    if exclude_product_id is not None:
        query = query.where(Product.id != exclude_product_id)

    existing_id = db.execute(query).scalar_one_or_none()
    if existing_id is not None:
        raise DuplicateSkuError(f"A product with SKU '{sku}' already exists.")


def create_product(db: Session, payload: ProductCreate) -> Product:
    """Create a new product with an auto-generated, never-reused product_code."""
    sku = payload.sku.strip()
    _check_sku_available(db, sku)

    product = Product(
        product_code=generate_sequential_code(
            db, model=Product, code_column=Product.product_code,
            prefix=PRODUCT_CODE_PREFIX, digits=PRODUCT_CODE_DIGITS,
        ),
        product_name=payload.product_name.strip(),
        category=payload.category.strip(),
        brand=payload.brand.strip(),
        model_number=payload.model_number,
        sku=sku,
        price=payload.price,
        discount=payload.discount,
        final_price=compute_final_price(payload.price, payload.discount),
        stock_quantity=payload.stock_quantity,
        warranty=payload.warranty,
        description=payload.description,
        features=payload.features,
        specifications=payload.specifications,
        availability_status=payload.availability_status,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product_by_id(db: Session, product_id: int) -> Product:
    """Fetch a single non-deleted product, or raise ProductNotFoundError."""
    product = db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted.is_(False))
    ).scalar_one_or_none()

    if product is None:
        raise ProductNotFoundError(f"Product {product_id} was not found.")

    return product


def get_product_by_code(db: Session, product_code: str) -> Product | None:
    """
    Look up a non-deleted product by its product_code (e.g. "PRD000001").

    Added for Module 7 (Data Import): Knowledge Base import files
    reference a product by its human-readable code rather than its
    internal numeric id, since a spreadsheet author has no reasonable
    way to know the id. Returns None (not an exception) so the caller
    can report an "Invalid Product Link" row error instead of a 404.
    """
    return db.execute(
        select(Product).where(
            Product.product_code == product_code.strip(), Product.is_deleted.is_(False)
        )
    ).scalar_one_or_none()


def get_product_by_sku(db: Session, sku: str) -> Product | None:
    """
    Look up a non-deleted product by SKU.

    Added for Module 7 (Data Import): needed to resolve "update
    existing" for a duplicate-SKU row. Returns None, not an exception.
    """
    return db.execute(
        select(Product).where(Product.sku == sku.strip(), Product.is_deleted.is_(False))
    ).scalar_one_or_none()


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    """Update an existing product, re-checking SKU uniqueness against every other row."""
    product = get_product_by_id(db, product_id)

    sku = payload.sku.strip()
    _check_sku_available(db, sku, exclude_product_id=product.id)

    product.product_name = payload.product_name.strip()
    product.category = payload.category.strip()
    product.brand = payload.brand.strip()
    product.model_number = payload.model_number
    product.sku = sku
    product.price = payload.price
    product.discount = payload.discount
    product.final_price = compute_final_price(payload.price, payload.discount)
    product.stock_quantity = payload.stock_quantity
    product.warranty = payload.warranty
    product.description = payload.description
    product.features = payload.features
    product.specifications = payload.specifications
    product.availability_status = payload.availability_status

    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(db: Session, product_id: int) -> None:
    """Soft-delete a product — see soft_delete_customer for the same reasoning."""
    product = get_product_by_id(db, product_id)
    product.is_deleted = True
    product.deleted_at = utcnow()
    db.commit()


def list_products(
    db: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    availability: ProductAvailability | None = None,
    sort: SortOption = "newest",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Product], int]:
    """List non-deleted products with search, filter, sort, and pagination."""
    query = select(Product).where(Product.is_deleted.is_(False))
    count_query = select(func.count()).select_from(Product).where(
        Product.is_deleted.is_(False)
    )

    if search:
        search_term = f"%{search.strip()}%"
        search_condition = or_(
            Product.product_name.ilike(search_term),
            Product.brand.ilike(search_term),
            Product.category.ilike(search_term),
            Product.sku.ilike(search_term),
        )
        query = query.where(search_condition)
        count_query = count_query.where(search_condition)

    if category:
        category_term = f"%{category.strip()}%"
        query = query.where(Product.category.ilike(category_term))
        count_query = count_query.where(Product.category.ilike(category_term))

    if brand:
        brand_term = f"%{brand.strip()}%"
        query = query.where(Product.brand.ilike(brand_term))
        count_query = count_query.where(Product.brand.ilike(brand_term))

    if availability is not None:
        query = query.where(Product.availability_status == availability)
        count_query = count_query.where(Product.availability_status == availability)

    sort_map = {
        "newest": Product.created_at.desc(),
        "oldest": Product.created_at.asc(),
        "name_asc": Product.product_name.asc(),
        "name_desc": Product.product_name.desc(),
    }
    query = query.order_by(sort_map.get(sort, Product.created_at.desc()))

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
