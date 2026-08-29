# Data Import & Bulk Upload — Module 7

## Overview

Bulk CSV/Excel import for Customers, Products, and Knowledge Base,
built entirely on top of Module 5/6's existing validation and service
functions — no validation logic is duplicated. Manual Add/Edit/Delete
is completely unaffected; import is an additional way to get data in,
not a replacement.

## Design decisions worth stating plainly

**Stateless preview → import.** The preview endpoint doesn't persist
anything server-side. The frontend keeps the selected `File` in memory
and re-uploads it to the actual import endpoint after the user confirms
— this avoids needing session/temp-file storage for a two-step flow, at
the cost of parsing the file twice. For files up to 50MB this is fast
enough not to matter.

**Progress bar is honest, not simulated.** A single synchronous
request handles the whole import — there's no background job queue in
this project (deliberately not added; that would be a meaningfully
larger addition than this module's scope). The frontend tracks real
upload progress via axios' `onUploadProgress`, then shows a labeled
"Processing..." state (not a fabricated number) while awaiting the
server's response, which arrives with final imported/skipped/failed/
duplicate counts all at once. No incremental per-row progress event
exists to display during that phase, and the UI doesn't pretend one
does.

**"Import All" vs "Import Valid Only."** A row that fails the same
Pydantic validation manual entry uses can never be written to the
database either way — that invariant isn't negotiable. Both options
report a genuinely invalid row under `failed`; the difference is
reporting semantics (attempted-and-failed vs skipped-before-attempting),
not a difference in what ends up in the database. This is documented in
`app/services/import_service.py`'s module docstring too.

**Knowledge Base duplicate key.** Unlike Customer.phone or Product.sku,
`knowledge_base` has no single unique column. The import engine treats
`(product_id, title)` as an entry's identity for duplicate detection —
a reasonable, documented choice given the table's actual schema.

**No dedicated "download error report" endpoint.** The import
response already includes every failed row and its reasons
(`ImportSummary.failed_rows`). The frontend builds the downloadable CSV
client-side from that JSON — avoiding an unnecessary round-trip for
data the browser already has.

## Entry points (Sidebar/Navbar/Dashboard NOT redesigned)

Per this module's explicit scope, the Sidebar/Navbar/Logo/Layout are
untouched — verified by file hash this session. The Import Center is
reachable via:
- The Dashboard's **"Import CSV" Quick Action** (built as a placeholder
  in Module 4 specifically for this — only its `onClick` changed)
- A small **"Import"** button added next to "Add Customer" / "Add
  Product" / "Add Knowledge" on each management page's header (one
  button each; the pages' core table/filter/modal logic is untouched)

## Database

No new tables, no schema changes — reuses the `customers`, `products`,
and `knowledge_base` tables exactly as Module 5/6 defined them.

## API

All under `API_V1_PREFIX/import`, JWT-protected.

| Method | Path | Purpose |
|---|---|---|
| POST | `/import/{entity}/preview` | Parse + validate a file, no writes |
| POST | `/import/{entity}` | Parse, validate, and write to the database |
| GET | `/import/{entity}/template?format=csv\|xlsx` | Download a sample template |

`entity` is `customers`, `products`, or `knowledge-base`.

### POST /import/{entity}/preview
Multipart form with a `file` field. Response:
```json
{
  "entity": "customers",
  "headers": ["full_name", "phone", "..."],
  "missing_required_columns": [],
  "total_rows": 42,
  "valid_count": 38,
  "invalid_count": 3,
  "duplicate_count": 1,
  "preview_rows": [ /* first 20 rows, each with status + errors */ ]
}
```

### POST /import/{entity}?strategy=valid_only&duplicate_handling=skip
Same multipart body. `strategy`: `all` | `valid_only` (default).
`duplicate_handling`: `skip` (default) | `update`. Response:
```json
{
  "entity": "customers",
  "total_rows": 42,
  "imported": 37,
  "skipped": 1,
  "failed": 3,
  "duplicates": 1,
  "validation_errors": 3,
  "failed_rows": [ /* every failed row, for the error report */ ]
}
```

## Validation rules

Every import reuses the exact schema each entity's manual form already
uses (`CustomerCreate`, `ProductCreate`, `KnowledgeCreate`) — so every
rule from Module 5/6 (required fields, phone/email/SKU format, price/
stock ≥ 0, product-link existence) applies to imported rows unchanged.
Two import-specific checks sit on top:
- **Missing required columns**: checked before any row validation runs,
  so the error is "your file is missing column X" once, not repeated
  per row.
- **Invalid Product Link** (Knowledge Base only): `product_code` must
  match an existing, non-deleted product; resolved to `product_id`
  before the row is validated.

## Sample templates

Headers match the database fields exactly, per spec — generated
directly from each entity's `all_columns` list (the same list used to
validate uploaded files), so the template and the validator can never
drift out of sync with each other.

| Entity | Required columns | Optional columns |
|---|---|---|
| Customers | full_name, phone | email, company, city, state, country, notes, status |
| Products | product_name, category, brand, sku, price, stock_quantity | model_number, discount, warranty, description, features, specifications, availability_status |
| Knowledge Base | product_code, title, question, answer, category | keywords, priority, status |

## Manual testing steps

**Backend (curl)**:
```bash
BASE=http://localhost:8000/api/v1
TOKEN="<paste a token from POST /auth/login>"

# Download a sample template
curl "$BASE/import/customers/template?format=csv" -H "Authorization: Bearer $TOKEN" -o customers_sample.csv

# Preview it
curl -X POST "$BASE/import/customers/preview" -H "Authorization: Bearer $TOKEN" \
  -F "file=@customers_sample.csv"

# Actually import it
curl -X POST "$BASE/import/customers?strategy=valid_only&duplicate_handling=skip" \
  -H "Authorization: Bearer $TOKEN" -F "file=@customers_sample.csv"

# Re-import the same file — should now report it as a duplicate (skipped)
curl -X POST "$BASE/import/customers?strategy=valid_only&duplicate_handling=skip" \
  -H "Authorization: Bearer $TOKEN" -F "file=@customers_sample.csv"

# Reject a bad file type
curl -X POST "$BASE/import/customers/preview" -H "Authorization: Bearer $TOKEN" \
  -F "file=@customers_sample.csv;type=application/pdf;filename=fake.pdf"
# -> 400, "Unsupported file type"

# No token — expect 401
curl -X POST "$BASE/import/customers/preview" -F "file=@customers_sample.csv"
```

**Frontend**
1. Dashboard → Quick Actions → "Import CSV" → lands on `/import`.
2. Each management page (Customers/Products/Knowledge Base) → "Import" button → lands on `/import?type=<entity>` with that card highlighted.
3. Download Sample CSV / Sample Excel for each of the three cards — files open correctly and headers match the manual Add form's fields.
4. Upload a `.pdf` — rejected client-side with "Only .csv and .xlsx files are allowed."
5. Upload a valid sample file → Preview Data → see total rows, valid/invalid/duplicate counts, first-20-row table with per-row status.
6. Edit the sample to remove a required column entirely → Preview → see the "missing required column(s)" message instead of per-row errors.
7. Edit a row to have an invalid email/negative price/negative stock → Preview → that row shows "invalid" with the reason.
8. For Knowledge Base: set `product_code` to something that doesn't exist → "Invalid Product Link" error on that row.
9. Import a file, then import the same file again with "Update Existing" selected → second import updates the existing records instead of creating duplicates; with "Skip Duplicate" (default) selected, they're skipped instead.
10. After import, download the Error Report (if any rows failed) → CSV opens with row_number, reasons, and original data columns aligned correctly.
11. Confirm manual Add/Edit/Delete still work on Customers/Products/Knowledge Base after importing — nothing about Module 5/6 broke.
12. Resize through mobile/tablet/laptop/desktop — cards stack to one column on narrow screens, preview table scrolls horizontally.
