"""
Data Import routes.

Every route requires a valid JWT (Depends(get_current_user)), same as
every other business route. `entity` in the URL path is looked up in
IMPORT_HANDLERS — an unknown entity key returns 404 rather than 500.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.import_schemas import DuplicateHandling, ImportPreviewResponse, ImportStrategy, ImportSummary
from app.services.import_config import IMPORT_HANDLERS
from app.services.import_service import execute_import, preview_import
from app.services.template_service import generate_csv_template, generate_xlsx_template
from app.utils.exceptions import InvalidFileError
from app.utils.file_parsing import parse_uploaded_file

router = APIRouter(prefix="/import", tags=["Data Import"])


def _get_handler(entity: str):
    handler = IMPORT_HANDLERS.get(entity)
    if handler is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown import entity '{entity}'. Valid options: {', '.join(IMPORT_HANDLERS)}.",
        )
    return handler


@router.post("/{entity}/preview", response_model=ImportPreviewResponse)
async def preview_import_route(
    entity: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parse and validate an uploaded file without writing anything to the
    database — powers the Preview step (first 20 rows, total rows,
    detected columns, valid/invalid/duplicate counts).
    """
    handler = _get_handler(entity)
    try:
        headers, rows = await parse_uploaded_file(file)
    except InvalidFileError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return preview_import(db, handler, headers, rows)


@router.post("/{entity}", response_model=ImportSummary)
async def execute_import_route(
    entity: str,
    file: UploadFile,
    strategy: ImportStrategy = Query(default="valid_only"),
    duplicate_handling: DuplicateHandling = Query(default="skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parse, validate, and actually import an uploaded file.

    The frontend re-uploads the same file here after the user confirms
    from the Preview step — no server-side session/temp storage is
    needed between preview and import, keeping this stateless.
    """
    handler = _get_handler(entity)
    try:
        headers, rows = await parse_uploaded_file(file)
    except InvalidFileError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return execute_import(db, handler, headers, rows, strategy, duplicate_handling)


@router.get("/{entity}/template")
def download_template_route(
    entity: str,
    file_format: str = Query(default="csv", alias="format", pattern="^(csv|xlsx)$"),
    current_user: User = Depends(get_current_user),
):
    """Download a sample CSV or Excel template for the given entity."""
    handler = _get_handler(entity)

    if file_format == "csv":
        content = generate_csv_template(handler)
        media_type = "text/csv"
    else:
        content = generate_xlsx_template(handler)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    filename = f"{handler.key}_template.{file_format}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
