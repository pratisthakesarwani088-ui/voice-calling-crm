"""
Customer service — business logic only.

Framework-agnostic like app.services.auth_service: takes a DB session
and plain/Pydantic inputs, returns plain SQLAlchemy objects, raises
custom exceptions on failure. Routes (app/routes/customers.py) map
those exceptions to HTTP responses.
"""

import csv
import io
import math
from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.base import utcnow
from app.models.call import Call
from app.models.customer import Customer
from app.models.enums import CustomerStatus, FollowUpStatus
from app.models.follow_up import FollowUp
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.utils.code_generator import generate_sequential_code
from app.utils.exceptions import CustomerNotFoundError, DuplicatePhoneError

CUSTOMER_CODE_PREFIX = "CUS"
CUSTOMER_CODE_DIGITS = 6

SortOption = Literal["newest", "oldest", "name_asc", "name_desc"]


def _generate_customer_code(db: Session) -> str:
    """
    Generate the next sequential customer code (CUS000001, CUS000002, ...).

    See app.utils.code_generator.generate_sequential_code for the
    algorithm — soft-deleted customers are NOT excluded from the
    lookup, which is what guarantees a deleted customer's code is
    never reused, per the Module 5 spec.
    """
    return generate_sequential_code(
        db,
        model=Customer,
        code_column=Customer.customer_code,
        prefix=CUSTOMER_CODE_PREFIX,
        digits=CUSTOMER_CODE_DIGITS,
    )


def _normalize_phone(phone: str) -> str:
    return phone.strip()


def _check_phone_available(
    db: Session, phone: str, exclude_customer_id: int | None = None
) -> None:
    """
    Raise DuplicatePhoneError if `phone` is already taken.

    Checked against ALL rows, including soft-deleted ones — the
    database's unique constraint does the same (soft delete doesn't
    remove the row), so a deleted customer's phone number can never be
    reassigned to a new customer. This function just turns that DB
    constraint into a clean, friendly error instead of a raw
    IntegrityError.
    """
    query = select(Customer.id).where(Customer.phone == phone)
    if exclude_customer_id is not None:
        query = query.where(Customer.id != exclude_customer_id)

    existing_id = db.execute(query).scalar_one_or_none()
    if existing_id is not None:
        raise DuplicatePhoneError(f"A customer with phone '{phone}' already exists.")


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    """Create a new customer with an auto-generated, never-reused customer_code."""
    phone = _normalize_phone(payload.phone)
    _check_phone_available(db, phone)

    customer = Customer(
        customer_code=_generate_customer_code(db),
        full_name=payload.full_name.strip(),
        phone=phone,
        email=payload.email,
        company=payload.company,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        notes=payload.notes,
        status=payload.status,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer_by_id(db: Session, customer_id: int) -> Customer:
    """Fetch a single non-deleted customer, or raise CustomerNotFoundError."""
    customer = db.execute(
        select(Customer).where(
            Customer.id == customer_id, Customer.is_deleted.is_(False)
        )
    ).scalar_one_or_none()

    if customer is None:
        raise CustomerNotFoundError(f"Customer {customer_id} was not found.")

    return customer


def get_customer_by_phone(db: Session, phone: str) -> Customer | None:
    """
    Look up a non-deleted customer by phone number.

    Added for Module 7 (Data Import): the import engine needs this to
    resolve "update existing" for a duplicate-phone row. Returns None
    (not an exception) — the caller decides what a missing match means.
    """
    return db.execute(
        select(Customer).where(
            Customer.phone == phone.strip(), Customer.is_deleted.is_(False)
        )
    ).scalar_one_or_none()


def update_customer(db: Session, customer_id: int, payload: CustomerUpdate) -> Customer:
    """Update an existing customer, re-checking phone uniqueness against every other row."""
    customer = get_customer_by_id(db, customer_id)

    phone = _normalize_phone(payload.phone)
    _check_phone_available(db, phone, exclude_customer_id=customer.id)

    customer.full_name = payload.full_name.strip()
    customer.phone = phone
    customer.email = payload.email
    customer.company = payload.company
    customer.city = payload.city
    customer.state = payload.state
    customer.country = payload.country
    customer.notes = payload.notes
    customer.status = payload.status

    db.commit()
    db.refresh(customer)
    return customer


def soft_delete_customer(db: Session, customer_id: int) -> None:
    """
    Safely delete a customer: soft-deletes the customer row plus every
    customer-specific record tied to it (Calls — including their
    transcripts/recordings/AI summaries — and pending Follow-ups), all
    in one transaction so nothing partially commits.

    Never issues a DB-level DELETE. Every row (customer, its calls,
    its follow-ups) remains in the table permanently for audit/history
    — see _generate_customer_code and _check_phone_available for why
    that matters for the customer row specifically, and Module 2/9/10's
    "calls are an audit/compliance trail" reasoning for why Call rows
    are soft-deleted (hidden) rather than physically removed too.

    Only two tables reference customer_id anywhere in this schema —
    Call and FollowUp (verified: no other model has a customer_id
    column) — so cascading to exactly those two is what "prevent
    orphan records" means here; there is no separate notifications,
    recordings, or conversation-history table to also touch. Products
    and Knowledge Base are never touched — they aren't customer-owned
    and have no customer_id column at all.

    Dashboard stats/Call History/Reports all already filter on
    Call.is_deleted / FollowUp.status == PENDING, so soft-deleting
    these rows here is immediately reflected everywhere that reads
    them — no separate "update the dashboard" step is needed.
    """
    customer = get_customer_by_id(db, customer_id)

    now = utcnow()
    customer.is_deleted = True
    customer.deleted_at = now

    calls = db.execute(
        select(Call).where(Call.customer_id == customer_id, Call.is_deleted.is_(False))
    ).scalars().all()
    for call in calls:
        call.is_deleted = True
        call.deleted_at = now

    follow_ups = db.execute(
        select(FollowUp).where(
            FollowUp.customer_id == customer_id, FollowUp.status == FollowUpStatus.PENDING
        )
    ).scalars().all()
    for follow_up in follow_ups:
        follow_up.status = FollowUpStatus.CANCELLED

    # One commit — customer + all its calls + all its follow-ups
    # succeed or fail together, so a mid-way failure can never leave
    # the customer deleted with its calls/follow-ups still active (or
    # vice versa).
    db.commit()


def list_customers(
    db: Session,
    *,
    search: str | None = None,
    status_filter: CustomerStatus | None = None,
    city: str | None = None,
    state: str | None = None,
    sort: SortOption = "newest",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Customer], int]:
    """
    List non-deleted customers with search, filter, sort, and pagination.

    Returns (rows_for_this_page, total_matching_count) — the route layer
    turns that into a CustomerListResponse with total_pages computed.
    """
    query = select(Customer).where(Customer.is_deleted.is_(False))
    count_query = select(func.count()).select_from(Customer).where(
        Customer.is_deleted.is_(False)
    )

    if search:
        search_term = f"%{search.strip()}%"
        search_condition = or_(
            Customer.full_name.ilike(search_term),
            Customer.phone.ilike(search_term),
            Customer.email.ilike(search_term),
            Customer.company.ilike(search_term),
        )
        query = query.where(search_condition)
        count_query = count_query.where(search_condition)

    if status_filter is not None:
        query = query.where(Customer.status == status_filter)
        count_query = count_query.where(Customer.status == status_filter)

    if city:
        city_term = f"%{city.strip()}%"
        query = query.where(Customer.city.ilike(city_term))
        count_query = count_query.where(Customer.city.ilike(city_term))

    if state:
        state_term = f"%{state.strip()}%"
        query = query.where(Customer.state.ilike(state_term))
        count_query = count_query.where(Customer.state.ilike(state_term))

    sort_map = {
        "newest": Customer.created_at.desc(),
        "oldest": Customer.created_at.asc(),
        "name_asc": Customer.full_name.asc(),
        "name_desc": Customer.full_name.desc(),
    }
    query = query.order_by(sort_map.get(sort, Customer.created_at.desc()))

    total = db.execute(count_query).scalar_one()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    rows = list(db.execute(query).scalars().all())
    return rows, total


def total_pages_for(total: int, page_size: int) -> int:
    """Shared page-count math, used by the route layer."""
    if total == 0:
        return 0
    return math.ceil(total / page_size)


# Cap for a CSV export — well above any realistic customer base for
# this single-admin CRM, just a safety bound rather than a real limit.
EXPORT_MAX_ROWS = 50000


def export_customers_csv(
    db: Session,
    *,
    search: str | None = None,
    status_filter: CustomerStatus | None = None,
    city: str | None = None,
    state: str | None = None,
    sort: SortOption = "newest",
) -> bytes:
    """
    All customers matching the given filters (no pagination), as CSV
    bytes. Reuses list_customers' own filter/sort logic — the same
    WHERE clauses the Customers page's search/filter bar already uses
    — rather than re-deriving them, so an export always matches what
    the admin is currently looking at.
    """
    rows, _total = list_customers(
        db,
        search=search,
        status_filter=status_filter,
        city=city,
        state=state,
        sort=sort,
        page=1,
        page_size=EXPORT_MAX_ROWS,
    )

    columns = [
        "customer_code",
        "full_name",
        "phone",
        "email",
        "company",
        "city",
        "state",
        "country",
        "status",
        "notes",
        "created_at",
    ]
    header_labels = [
        "Customer Code",
        "Customer Name",
        "Phone Number",
        "Email",
        "Company",
        "City",
        "State",
        "Country",
        "Status",
        "Notes",
        "Created Date",
    ]

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header_labels)
    for row in rows:
        values = []
        for col in columns:
            raw_value = getattr(row, col)
            if col == "created_at":
                values.append(raw_value.isoformat())
            elif col == "status":
                # CustomerStatus is a (str, Enum) mix-in — str(member) gives
                # "CustomerStatus.ACTIVE", not the plain value, so this must
                # be unwrapped explicitly (same convention as the sample
                # rows in app/services/import_config.py).
                values.append(raw_value.value)
            else:
                values.append(raw_value or "")
        writer.writerow(values)

    return buffer.getvalue().encode("utf-8-sig")  # BOM helps Excel open it with correct encoding
