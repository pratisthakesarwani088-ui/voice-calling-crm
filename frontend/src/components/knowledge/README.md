# components/knowledge/

Feature-specific components for Knowledge Base Management (Module 6).
Mirrors `components/customers/`'s structure.

- `KnowledgeTable.jsx`     — list table; takes a `productNameById` lookup
  so it can show a human-readable linked product without per-row fetches
- `KnowledgeFormModal.jsx` — shared Add/Edit form; `products` prop populates
  the "Linked Product" dropdown
- `KnowledgeViewModal.jsx` — read-only detail view
- `KnowledgeFilters.jsx`   — search/category/status/sort controls

Orchestrated by `pages/KnowledgeBasePage.jsx`, which also fetches the
product list used for the dropdown/lookup.
