"""
Customer request/response schemas.

Create and Update share the same field-level validation (name/phone
required + trimmed, phone shape checked, email format checked when
provided) via CustomerWriteBase — this is the "reuse validation between
Add and Edit" the Module 5 spec asks for; the two subclasses only differ
in which fields are required.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import CustomerStatus
from app.utils.validators import validate_phone, validate_required_text

# Fixed page size per the Module 5 spec ("10 customers per page"). Not
# user-configurable by design — exposed as a named constant (not a bare
# literal) so the one place that would ever need to change it is here.
CUSTOMERS_DEFAULT_PAGE_SIZE = 10
CUSTOMERS_MAX_PAGE_SIZE = 100


class CustomerWriteBase(BaseModel):
    """Shared, reusable fields + validation for Create and Update."""

    company: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=5000)
    status: CustomerStatus = CustomerStatus.ACTIVE

    @field_validator("company", "city", "state", "country", mode="before")
    @classmethod
    def blank_optional_to_none(cls, value: str | None) -> str | None:
        """An empty string in an optional field is treated as "not provided"."""
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("notes", mode="before")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class CustomerCreate(CustomerWriteBase):
    """Payload for POST /customers (the Add Customer form)."""

    full_name: str = Field(..., min_length=1, max_length=150)
    phone: str = Field(..., min_length=1, max_length=20)
    email: EmailStr | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return validate_required_text(value, "Customer name", max_length=150)

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, value: str) -> str:
        return validate_phone(value)

    @field_validator("email", mode="before")
    @classmethod
    def blank_email_to_none(cls, value):
        # EmailStr rejects "" outright — treat a blank string the same
        # as "not provided", since email is optional on this form.
        if isinstance(value, str) and not value.strip():
            return None
        return value


class CustomerUpdate(CustomerCreate):
    """
    Payload for PUT /customers/{id} (the Edit Customer form).

    Same required fields as Create (full name, phone) — editing a
    customer is a full-form save, not a partial patch — so this simply
    reuses CustomerCreate's validation as-is.
    """

    pass


class CustomerOut(BaseModel):
    """Public-facing representation of a Customer row."""

    id: int
    customer_code: str
    full_name: str
    phone: str
    email: str | None
    company: str | None
    city: str | None
    state: str | None
    country: str | None
    notes: str | None
    status: CustomerStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerListResponse(BaseModel):
    """Paginated list response for GET /customers."""

    items: list[CustomerOut]
    total: int
    page: int
    page_size: int
    total_pages: int
