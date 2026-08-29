"""
Data Import request/response schemas.

One shared shape works for all three entities (Customers, Products,
Knowledge Base) — the row data itself stays a loosely-typed dict since
its shape differs per entity; everything else (row status, counts,
summary) is identical across entities.
"""

from typing import Literal

from pydantic import BaseModel

ImportStrategy = Literal["all", "valid_only"]
DuplicateHandling = Literal["skip", "update"]
RowStatus = Literal["valid", "invalid", "duplicate"]


class ImportRowResult(BaseModel):
    """One row's outcome — used in both the preview and the final import result."""

    row_number: int  # 1-based, matching the spreadsheet's data rows (header excluded)
    status: RowStatus
    data: dict[str, str]
    errors: list[str] = []


class ImportPreviewResponse(BaseModel):
    """Response for POST /import/{entity}/preview."""

    entity: str
    headers: list[str]
    missing_required_columns: list[str]
    total_rows: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    preview_rows: list[ImportRowResult]  # first 20 rows only, per the spec


class ImportSummary(BaseModel):
    """Response for POST /import/{entity} — the final result."""

    entity: str
    total_rows: int
    imported: int
    skipped: int
    failed: int
    duplicates: int
    validation_errors: int
    failed_rows: list[ImportRowResult]  # for the downloadable error report
