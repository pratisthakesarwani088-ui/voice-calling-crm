# Product Management & Knowledge Base — Module 6

## Overview

Two CRUD modules built on the same patterns established in Module 5
(Customer Management): soft delete, auto-generated never-reused codes,
search/filter/sort/pagination, and a shared toast/modal/pagination UI
layer. Every endpoint requires a valid JWT.

## Database changes

- **New table `products`** — mirrors `customers`' shape: soft-delete
  enabled, unique `product_code` and `sku`, indexed `category`/`brand`/
  `availability_status`. `price`/`discount`/`final_price` use `NUMERIC(12,2)`
  (not float) for currency precision. `final_price` is always computed
  server-side (`price - discount`, floored at 0) — never accepted from
  client input.
- **`knowledge_base` extended**: added `product_id` (FK → `products.id`,
  `NOT NULL`, `ON DELETE CASCADE`), `question` (`TEXT NOT NULL`),
  `answer` (`TEXT NOT NULL`), `keywords` (`VARCHAR(500)`, indexed),
  `priority` (enum, `NOT NULL`). Module 2's `content` column was relaxed
  to nullable (not dropped) since it's superseded by `question`/`answer`
  and isn't used by any code — no destructive change to migration history.
- Migration: `backend/alembic/versions/20260818_0900_a08472177fa9_add_products_and_extend_knowledge_base.py`

**Stated assumption, for transparency:** the `question`/`answer`/`priority`
columns are added as `NOT NULL` directly (no default), which is only
valid if the `knowledge_base` table is empty at migration time. This
holds for this project — no module before this one ever wrote to that
table — but is worth confirming against a real database before running
this migration on any environment where that might not be true.

- Two new enums: `ProductAvailability` (in_stock / out_of_stock /
  discontinued), `KnowledgeBasePriority` (low / medium / high).

## AI-ready design (per spec — no AI implemented)

- Every Knowledge Base entry requires a `product_id` — enforced by the
  database FK and re-validated in the service layer (returns a clean
  404 for an unknown product, not a raw integrity error).
- `keywords` is a plain, indexed, searchable text column — deliberately
  **not** a vector/embedding column. This satisfies "store searchable
  keywords" and "design so semantic search can be added later" without
  implementing any actual AI/RAG/embeddings, which are explicitly out
  of scope for this module.
- `search` on the Knowledge Base list endpoint already matches against
  `title`, `question`, and `keywords` — a future AI module can add
  semantic ranking on top of this without changing the table shape.

## Code generation

Both `customer_code` (Module 5) and `product_code` (this module) now
share one implementation — `backend/app/utils/code_generator.py` — to
avoid duplicating the "sequential, never-reused" algorithm. This is a
refactor of `customer_service.py`, not a behavior change: customer code
generation works identically to before, verified by keeping the exact
same algorithm.

Format: `PRD000001`, `PRD000002`, ... — same reasoning as `customer_code`:
derived from the last inserted row (by id), so a soft-deleted product's
code is never reissued.

## API

All under `API_V1_PREFIX`, JWT-protected.

### Products (`/products`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/products` | Create |
| GET | `/products` | List (search/category/brand/availability/sort/paginate) |
| GET | `/products/{id}` | Get by ID |
| PUT | `/products/{id}` | Update |
| DELETE | `/products/{id}` | Soft delete |

### Knowledge Base (`/knowledge-base`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/knowledge-base` | Create (validates `product_id` exists) |
| GET | `/knowledge-base` | List (search/category/status/sort/paginate) |
| GET | `/knowledge-base/{id}` | Get by ID |
| PUT | `/knowledge-base/{id}` | Update (re-validates `product_id`) |
| DELETE | `/knowledge-base/{id}` | Soft delete |

## Validation rules

**Products**: name/category/brand/SKU required+trimmed; SKU unique
(checked against soft-deleted rows too, same reasoning as Customer
phone uniqueness); price required, ≥ 0; discount ≥ 0; stock quantity
required, ≥ 0 ("stock cannot be negative"); `final_price` never
user-editable.

**Knowledge Base**: `product_id` required and must reference an
existing, non-deleted product; title/question/answer/category
required+trimmed; keywords optional, normalized (trimmed, blank
entries dropped) whether sent as a list or a comma-separated string.

Both reuse validation between Add and Edit via one form component per
entity, same as Module 5.

## Frontend components

| Products | Knowledge Base |
|---|---|
| `pages/ProductsPage.jsx` | `pages/KnowledgeBasePage.jsx` |
| `components/products/ProductTable.jsx` | `components/knowledge/KnowledgeTable.jsx` |
| `components/products/ProductFormModal.jsx` | `components/knowledge/KnowledgeFormModal.jsx` |
| `components/products/ProductViewModal.jsx` | `components/knowledge/KnowledgeViewModal.jsx` |
| `components/products/ProductFilters.jsx` | `components/knowledge/KnowledgeFilters.jsx` |

Both reuse `Modal`, `ConfirmDialog`, `Pagination`, `Badge`, `Alert`,
`Spinner`, and the `ToastContext`/`useToast` system built in Module 5 —
no changes needed to any of them.

`ActionButtons` (Module 4) gained one backward-compatible addition: an
optional `visibleActions` prop (defaults to all four, so Module 4's
dashboard and Module 5's Customers table are unaffected) — Products and
Knowledge Base pass `["view", "edit", "delete"]` to omit the Call button,
which the spec doesn't include for these two entities.

## Manual testing steps

**Backend** — replace `<token>` with a value from `POST /auth/login`:
```bash
BASE=http://localhost:8000/api/v1

# Create a product
curl -X POST $BASE/products -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Wireless Mouse","category":"Accessories","brand":"TechNova","sku":"WM-001","price":29.99,"discount":5,"stock_quantity":50}'

# Duplicate SKU — expect 409
curl -X POST $BASE/products -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Other Mouse","category":"Accessories","brand":"TechNova","sku":"WM-001","price":19.99,"stock_quantity":10}'

# List with search/sort
curl "$BASE/products?search=Mouse&sort=name_asc" -H "Authorization: Bearer <token>"

# Create a Knowledge Base entry linked to product id 1
curl -X POST $BASE/knowledge-base -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"title":"Battery life","question":"How long does the battery last?","answer":"Up to 12 months on 2 AA batteries.","keywords":["battery","power"],"category":"Specs"}'

# Bad product_id — expect 404
curl -X POST $BASE/knowledge-base -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_id":9999,"title":"x","question":"x","answer":"x","category":"x"}'

# No token — expect 401
curl $BASE/products
curl $BASE/knowledge-base
```

**Frontend**
1. Log in, click **Products** in the sidebar — empty state shows "No Products Found." + Add Product button.
2. Add a product with all fields — watch Final Price auto-update as you type Price/Discount — see "Product Added" toast.
3. Try a duplicate SKU — see inline error + "Validation Error" toast.
4. View/Edit/Delete a product — see the respective toasts; deleted product disappears from the list.
5. Search/filter (category, brand, availability) / sort — list updates accordingly.
6. Click **Knowledge Base** in the sidebar — empty state shows "No Knowledge Base Found." + Add Knowledge button.
7. Add a Knowledge entry — the "Linked Product" dropdown lists the products created above.
8. View/Edit/Delete a Knowledge entry — see the respective toasts.
9. Search Knowledge Base by keyword — confirm it matches title/question/keywords.
10. Resize through mobile/tablet/laptop/desktop — both tables scroll horizontally on narrow screens; filters/modals reflow correctly.
