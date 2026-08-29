"""
Per-entity import configuration.

Each entity supplies: which columns its import file needs, sample data
for the downloadable template, how to build that entity's existing
Create schema from a raw row dict (reusing Module 5/6 validation
unchanged), and how to detect/create/update records. The generic engine
in app/services/import_service.py never needs entity-specific code -
everything entity-specific lives here.
"""

from sqlalchemy.orm import Session

from app.models.enums import CustomerStatus, KnowledgeBasePriority, KnowledgeBaseStatus, ProductAvailability
from app.schemas.customer import CustomerCreate
from app.schemas.knowledge_base import KnowledgeCreate
from app.schemas.product import ProductCreate
from app.services.customer_service import create_customer, get_customer_by_phone, update_customer
from app.services.import_service import EntityImportHandler, RowLinkError
from app.services.knowledge_service import (
    create_knowledge_entry,
    get_knowledge_entry_by_product_and_title,
    update_knowledge_entry,
)
from app.services.product_service import create_product, get_product_by_code, get_product_by_sku, update_product


def _kwargs_from_row(row: dict[str, str], required: list[str], optional: list[str]) -> dict:
    """
    Build schema constructor kwargs from a raw row dict.

    Required columns are always passed through as-is (even if blank),
    so the schema's own "required" validation produces the error
    message - this function doesn't duplicate that check. Optional
    columns are only included when non-blank, so the schema's own
    defaults apply to anything the row left empty.
    """
    kwargs = {col: row.get(col, "") for col in required}
    for col in optional:
        value = row.get(col, "")
        if value != "":
            kwargs[col] = value
    return kwargs


# ----------------------------------------------------------------------
# Customers
# ----------------------------------------------------------------------

_CUSTOMER_REQUIRED = ["full_name", "phone"]
_CUSTOMER_OPTIONAL = ["email", "company", "city", "state", "country", "notes", "status"]


def _build_customer_schema(db: Session, row: dict[str, str]) -> CustomerCreate:
    kwargs = _kwargs_from_row(row, _CUSTOMER_REQUIRED, _CUSTOMER_OPTIONAL)
    return CustomerCreate(**kwargs)


CUSTOMER_IMPORT_HANDLER = EntityImportHandler(
    key="customers",
    label="Customers",
    required_columns=_CUSTOMER_REQUIRED,
    all_columns=_CUSTOMER_REQUIRED + _CUSTOMER_OPTIONAL,
    sample_rows=[
        {
            "full_name": "Aarav Mehta",
            "phone": "+91 98765 43210",
            "email": "aarav@example.com",
            "company": "Mehta Traders",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "notes": "Interested in the enterprise plan.",
            "status": CustomerStatus.ACTIVE.value,
        },
    ],
    build_schema=_build_customer_schema,
    dedup_key=lambda schema: schema.phone,
    find_existing=get_customer_by_phone,
    create=create_customer,
    update=update_customer,
)


# ----------------------------------------------------------------------
# Products
# ----------------------------------------------------------------------

_PRODUCT_REQUIRED = ["product_name", "category", "brand", "sku", "price", "stock_quantity"]
_PRODUCT_OPTIONAL = [
    "model_number",
    "discount",
    "warranty",
    "description",
    "features",
    "specifications",
    "availability_status",
]


def _build_product_schema(db: Session, row: dict[str, str]) -> ProductCreate:
    kwargs = _kwargs_from_row(row, _PRODUCT_REQUIRED, _PRODUCT_OPTIONAL)
    return ProductCreate(**kwargs)


PRODUCT_IMPORT_HANDLER = EntityImportHandler(
    key="products",
    label="Products",
    required_columns=_PRODUCT_REQUIRED,
    all_columns=_PRODUCT_REQUIRED + _PRODUCT_OPTIONAL,
    sample_rows=[
        {
            "product_name": "Wireless Mouse",
            "category": "Accessories",
            "brand": "TechNova",
            "sku": "WM-001",
            "price": "29.99",
            "model_number": "TN-WM-01",
            "discount": "5.00",
            "stock_quantity": "50",
            "warranty": "1 Year",
            "description": "Ergonomic wireless mouse with USB receiver.",
            "features": "2.4GHz wireless, adjustable DPI",
            "specifications": "Weight: 90g, Battery: AA x1",
            "availability_status": ProductAvailability.IN_STOCK.value,
        },
    ],
    build_schema=_build_product_schema,
    dedup_key=lambda schema: schema.sku,
    find_existing=get_product_by_sku,
    create=create_product,
    update=update_product,
)


# ----------------------------------------------------------------------
# Knowledge Base
# ----------------------------------------------------------------------

_KNOWLEDGE_REQUIRED = ["product_code", "title", "question", "answer", "category"]
_KNOWLEDGE_OPTIONAL = ["keywords", "priority", "status"]


def _build_knowledge_schema(db: Session, row: dict[str, str]) -> KnowledgeCreate:
    product_code = row.get("product_code", "").strip()
    if not product_code:
        raise RowLinkError("product_code: is required.")

    product = get_product_by_code(db, product_code)
    if product is None:
        raise RowLinkError(f"product_code: no product found with code '{product_code}'.")

    kwargs = {col: row.get(col, "") for col in ["title", "question", "answer", "category"]}
    kwargs["product_id"] = product.id

    if row.get("keywords", "").strip():
        kwargs["keywords"] = row["keywords"]
    if row.get("priority", "").strip():
        kwargs["priority"] = row["priority"]
    if row.get("status", "").strip():
        kwargs["status"] = row["status"]

    return KnowledgeCreate(**kwargs)


def _knowledge_dedup_key(schema: KnowledgeCreate) -> str:
    return f"{schema.product_id}::{schema.title.strip().lower()}"


def _find_existing_knowledge(db: Session, key: str):
    product_id_str, title = key.split("::", 1)
    # Note: title was lowercased for the dedup key; the lookup below
    # compares against the stored (original-case) title. Bulk within-
    # file dedup still works via the key; the DB lookup step is a
    # best-effort exact-title match, consistent with how KB duplicates
    # are defined (see get_knowledge_entry_by_product_and_title).
    return get_knowledge_entry_by_product_and_title(db, int(product_id_str), title)


KNOWLEDGE_IMPORT_HANDLER = EntityImportHandler(
    key="knowledge-base",
    label="Knowledge Base",
    required_columns=_KNOWLEDGE_REQUIRED,
    all_columns=_KNOWLEDGE_REQUIRED + _KNOWLEDGE_OPTIONAL,
    sample_rows=[
        {
            "product_code": "PRD000001",
            "title": "Battery life",
            "question": "How long does the battery last?",
            "answer": "Up to 12 months on 2 AA batteries under normal use.",
            "category": "Specifications",
            "keywords": "battery, power, AA",
            "priority": KnowledgeBasePriority.MEDIUM.value,
            "status": KnowledgeBaseStatus.DRAFT.value,
        },
    ],
    build_schema=_build_knowledge_schema,
    dedup_key=_knowledge_dedup_key,
    find_existing=_find_existing_knowledge,
    create=create_knowledge_entry,
    update=update_knowledge_entry,
)


IMPORT_HANDLERS: dict[str, EntityImportHandler] = {
    "customers": CUSTOMER_IMPORT_HANDLER,
    "products": PRODUCT_IMPORT_HANDLER,
    "knowledge-base": KNOWLEDGE_IMPORT_HANDLER,
}
