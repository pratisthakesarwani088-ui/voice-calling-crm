"""
Product request/response schemas.

Mirrors app/schemas/customer.py's structure: Create/Update share
validation via a common base, matching Module 6's requirement to reuse
validation between Add and Edit.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ProductAvailability
from app.utils.validators import validate_required_text

PRODUCTS_DEFAULT_PAGE_SIZE = 10
PRODUCTS_MAX_PAGE_SIZE = 100


class ProductWriteBase(BaseModel):
    """Shared, reusable fields + validation for Create and Update."""

    model_number: str | None = Field(default=None, max_length=100)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    stock_quantity: int = Field(..., ge=0)
    warranty: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    features: str | None = Field(default=None, max_length=5000)
    specifications: str | None = Field(default=None, max_length=5000)
    availability_status: ProductAvailability = ProductAvailability.IN_STOCK

    @field_validator("model_number", "warranty", mode="before")
    @classmethod
    def blank_optional_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("description", "features", "specifications", mode="before")
    @classmethod
    def trim_long_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ProductCreate(ProductWriteBase):
    """Payload for POST /products (the Add Product form)."""

    product_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    brand: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=0)

    @field_validator("product_name")
    @classmethod
    def validate_product_name(cls, value: str) -> str:
        return validate_required_text(value, "Product name", max_length=200)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return validate_required_text(value, "Category", max_length=100)

    @field_validator("brand")
    @classmethod
    def validate_brand(cls, value: str) -> str:
        return validate_required_text(value, "Brand", max_length=100)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, value: str) -> str:
        return validate_required_text(value, "SKU", max_length=100)


class ProductUpdate(ProductCreate):
    """
    Payload for PUT /products/{id} (the Edit Product form).

    Same required fields as Create — editing is a full-form save, not a
    partial patch — so this reuses CustomerCreate-style validation as-is.
    """

    pass


class ProductOut(BaseModel):
    """Public-facing representation of a Product row."""

    id: int
    product_code: str
    product_name: str
    category: str
    brand: str
    model_number: str | None
    sku: str
    price: Decimal
    discount: Decimal
    final_price: Decimal
    stock_quantity: int
    warranty: str | None
    description: str | None
    features: str | None
    specifications: str | None
    availability_status: ProductAvailability
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """Paginated list response for GET /products."""

    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int
