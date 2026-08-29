# components/products/

Feature-specific components for Product Management (Module 6). Mirrors
`components/customers/`'s structure exactly.

- `ProductTable.jsx`     — list table; reuses `ActionButtons` (view/edit/delete only) and `Badge`
- `ProductFormModal.jsx` — shared Add/Edit form, includes a live Final Price preview
- `ProductViewModal.jsx` — read-only detail view
- `ProductFilters.jsx`   — search/category/brand/availability/sort controls

Orchestrated by `pages/ProductsPage.jsx`.
