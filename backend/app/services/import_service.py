"""
Data Import engine.

Deliberately reuses Module 5/6's existing Pydantic schemas
(CustomerCreate, ProductCreate, KnowledgeCreate) and service functions
(create_customer, update_customer, etc.) directly — every validation
rule already built for manual entry (required fields, phone/email
format, price >= 0, product-link existence...) applies unchanged to
imported rows, with zero duplicated logic. This module only adds the
import-specific glue: reading a row dict, building the right schema
from it, detecting duplicates in bulk, and tallying results.

Design note on "Import All" vs "Import Valid Only": a row that fails
validation can never be written to the database either way — the
schemas are the same schemas manual entry uses, and their invariants
(e.g. a customer must have a name and phone) aren't negotiable. Both
options report the row under `failed`; the difference is purely
reporting semantics ("attempted and failed" vs "skipped, not attempted")
kept for spec fidelity, not a difference in what ends up in the database.
"""

from dataclasses import dataclass, field
from typing import Any, Callable

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.schemas.import_schemas import (
    DuplicateHandling,
    ImportPreviewResponse,
    ImportRowResult,
    ImportStrategy,
    ImportSummary,
)

PREVIEW_ROW_LIMIT = 20


class RowLinkError(Exception):
    """Raised by an entity handler when a row references something that doesn't exist (e.g. an unknown product_code)."""

    pass


@dataclass
class ClassifiedRow:
    row_number: int
    raw: dict[str, str]
    schema: BaseModel | None
    status: str  # "valid" | "invalid" | "duplicate"
    errors: list[str] = field(default_factory=list)


@dataclass
class EntityImportHandler:
    """
    Everything the generic engine needs to know about one entity
    (Customers / Products / Knowledge Base). Each entity's own module
    (customer_service, product_service, knowledge_service) supplies the
    actual create/update/lookup functions — this dataclass just wires
    them together for the import loop.
    """

    key: str
    label: str
    required_columns: list[str]
    all_columns: list[str]
    sample_rows: list[dict[str, str]]
    build_schema: Callable[[Session, dict[str, str]], BaseModel]
    dedup_key: Callable[[BaseModel], str | None]
    find_existing: Callable[[Session, str], Any | None]
    create: Callable[[Session, BaseModel], Any]
    update: Callable[[Session, Any, BaseModel], Any]


def _format_validation_error(exc: ValidationError) -> list[str]:
    """Turn a Pydantic ValidationError into short, friendly messages (reuses the error 'msg' text)."""
    messages = []
    for error in exc.errors():
        field_name = ".".join(str(loc) for loc in error["loc"]) if error["loc"] else ""
        messages.append(f"{field_name}: {error['msg']}" if field_name else error["msg"])
    return messages


def check_missing_required_columns(headers: list[str], handler: EntityImportHandler) -> list[str]:
    header_set = set(headers)
    return [col for col in handler.required_columns if col not in header_set]


def _classify_rows(
    db: Session, handler: EntityImportHandler, rows: list[dict[str, str]]
) -> list[ClassifiedRow]:
    """
    Validate every row and detect duplicates — read-only, no writes.

    Duplicate detection considers both existing database rows AND
    earlier rows within the same file, so two identical rows in one
    upload correctly flag the second as a duplicate of the first.
    """
    seen_keys: set[str] = set()
    results: list[ClassifiedRow] = []

    for row_number, row in enumerate(rows, start=1):
        try:
            schema = handler.build_schema(db, row)
        except ValidationError as exc:
            results.append(
                ClassifiedRow(row_number, row, None, "invalid", _format_validation_error(exc))
            )
            continue
        except RowLinkError as exc:
            results.append(ClassifiedRow(row_number, row, None, "invalid", [str(exc)]))
            continue

        key = handler.dedup_key(schema)
        is_duplicate = False
        if key is not None:
            if key in seen_keys:
                is_duplicate = True
            elif handler.find_existing(db, key) is not None:
                is_duplicate = True
            else:
                seen_keys.add(key)

        results.append(
            ClassifiedRow(row_number, row, schema, "duplicate" if is_duplicate else "valid", [])
        )

    return results


def preview_import(
    db: Session, handler: EntityImportHandler, headers: list[str], rows: list[dict[str, str]]
) -> ImportPreviewResponse:
    """Validate every row (read-only) and summarize — powers the Preview step."""
    missing_columns = check_missing_required_columns(headers, handler)

    if missing_columns:
        # Can't meaningfully validate rows without the required columns
        # present — return immediately with an empty classification so
        # the frontend shows a clear "missing columns" message instead
        # of a wall of per-row errors that all say the same thing.
        return ImportPreviewResponse(
            entity=handler.key,
            headers=headers,
            missing_required_columns=missing_columns,
            total_rows=len(rows),
            valid_count=0,
            invalid_count=0,
            duplicate_count=0,
            preview_rows=[],
        )

    classified = _classify_rows(db, handler, rows)

    return ImportPreviewResponse(
        entity=handler.key,
        headers=headers,
        missing_required_columns=[],
        total_rows=len(rows),
        valid_count=sum(1 for r in classified if r.status == "valid"),
        invalid_count=sum(1 for r in classified if r.status == "invalid"),
        duplicate_count=sum(1 for r in classified if r.status == "duplicate"),
        preview_rows=[
            ImportRowResult(row_number=r.row_number, status=r.status, data=r.raw, errors=r.errors)
            for r in classified[:PREVIEW_ROW_LIMIT]
        ],
    )


def execute_import(
    db: Session,
    handler: EntityImportHandler,
    headers: list[str],
    rows: list[dict[str, str]],
    strategy: ImportStrategy,
    duplicate_handling: DuplicateHandling,
) -> ImportSummary:
    """Validate every row, then actually write the database changes — powers the Import step."""
    missing_columns = check_missing_required_columns(headers, handler)
    if missing_columns:
        return ImportSummary(
            entity=handler.key,
            total_rows=len(rows),
            imported=0,
            skipped=0,
            failed=len(rows),
            duplicates=0,
            validation_errors=0,
            failed_rows=[
                ImportRowResult(
                    row_number=0,
                    status="invalid",
                    data={},
                    errors=[f"Missing required column(s): {', '.join(missing_columns)}"],
                )
            ],
        )

    classified = _classify_rows(db, handler, rows)

    imported = 0
    skipped = 0
    failed = 0
    duplicates = 0
    failed_rows: list[ImportRowResult] = []

    for row in classified:
        if row.status == "invalid":
            failed += 1
            reason = "Attempted and failed validation." if strategy == "all" else "Skipped — failed validation."
            failed_rows.append(
                ImportRowResult(
                    row_number=row.row_number, status="invalid", data=row.raw, errors=row.errors or [reason]
                )
            )
            continue

        if row.status == "duplicate":
            duplicates += 1
            if duplicate_handling == "update":
                key = handler.dedup_key(row.schema)
                existing = handler.find_existing(db, key)
                if existing is not None:
                    handler.update(db, existing.id, row.schema)
                    imported += 1
                else:  # pragma: no cover - defensive; key was found moments ago
                    skipped += 1
            else:
                skipped += 1
            continue

        # valid, non-duplicate
        handler.create(db, row.schema)
        imported += 1

    validation_errors = sum(1 for r in classified if r.status == "invalid")

    return ImportSummary(
        entity=handler.key,
        total_rows=len(rows),
        imported=imported,
        skipped=skipped,
        failed=failed,
        duplicates=duplicates,
        validation_errors=validation_errors,
        failed_rows=failed_rows,
    )
