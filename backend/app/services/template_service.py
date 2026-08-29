"""
Sample import template generation.

Generates a downloadable CSV or Excel file with the exact column
headers an entity's import expects (matching its database fields, per
the Module 7 spec), pre-filled with one example row so the format is
self-explanatory.
"""

import csv
import io

from openpyxl import Workbook

from app.services.import_service import EntityImportHandler


def generate_csv_template(handler: EntityImportHandler) -> bytes:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=handler.all_columns)
    writer.writeheader()
    for sample_row in handler.sample_rows:
        writer.writerow({col: sample_row.get(col, "") for col in handler.all_columns})
    return buffer.getvalue().encode("utf-8-sig")  # BOM helps Excel open it with correct encoding


def generate_xlsx_template(handler: EntityImportHandler) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = handler.label[:31]  # Excel sheet name limit

    sheet.append(handler.all_columns)
    for sample_row in handler.sample_rows:
        sheet.append([sample_row.get(col, "") for col in handler.all_columns])

    for column_cells in sheet.columns:
        max_length = max((len(str(cell.value)) for cell in column_cells if cell.value), default=10)
        sheet.column_dimensions[column_cells[0].column_letter].width = min(max_length + 2, 40)

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
