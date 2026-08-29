# components/customers/

Feature-specific components for Customer Management (Module 5). Kept in
their own subfolder since they're not generic like the rest of
`components/` — each one is specific to the Customer entity.

- `CustomerTable.jsx`      — the customer list table; reuses `ActionButtons`
  and `Badge` from the parent `components/` folder
- `CustomerFormModal.jsx`  — shared Add/Edit form (one component, one set
  of validation, used for both — see the file's docstring)
- `CustomerViewModal.jsx`  — read-only detail view
- `CustomerFilters.jsx`    — search/status/city/state/sort controls

Orchestrated by `pages/CustomersPage.jsx`, which owns all the state
(filters, pagination, which modal is open) — these components are
intentionally "dumb"/presentational so they're easy to reuse or test.
