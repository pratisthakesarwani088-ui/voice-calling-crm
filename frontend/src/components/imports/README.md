# components/imports/

Feature-specific components for Data Import (Module 7).

- `ImportCard.jsx`         — one entity's full flow (upload -> preview ->
  options -> import with progress -> summary), self-contained
- `ImportPreviewTable.jsx` — first-20-rows preview with per-row status
- `ImportProgressBar.jsx`  — real upload progress + labeled "Processing..."
  state (see docs/data-import.md for why there's no fake incremental
  progress during server-side processing)
- `ImportSummaryPanel.jsx` — final counts + client-side error report download

Orchestrated by `pages/ImportCenterPage.jsx`, which renders three
independent `ImportCard` instances (one per entity).
