# components/

Small, reusable, presentational UI pieces shared across pages.

Auth (Module 3):
- `PasswordInput.jsx`   — labeled password field with show/hide toggle
- `Alert.jsx`           — success/error/info message banner
- `Spinner.jsx`         — small inline loading spinner (used in buttons)
- `ProtectedRoute.jsx`  — route guard, redirects to /login if not authenticated
- `GuestRoute.jsx`      — route guard, redirects to /dashboard if already authenticated

Branding & app shell (Module 4):
- `Logo.jsx`         — original TechNova Electronics "TN" logo (inline SVG); reused
  everywhere the brand appears — do not redesign
- `Sidebar.jsx`       — left navigation (permanent on desktop/laptop, collapsible on
  tablet, off-canvas drawer on mobile)
- `Navbar.jsx`        — top bar: hamburger/collapse toggle, search (UI only),
  notifications (UI only), profile menu
- `ProfileMenu.jsx`   — admin profile dropdown used inside Navbar

Dashboard (Module 4 — UI only, no backend calls):
- `StatCard.jsx`           — single metric card (Total Customers, etc.)
- `Badge.jsx`              — reusable status pill, shared by CallStatusPanel and
  RecentCallsTable so status colors stay consistent
- `SystemStatusPanel.jsx`  — backend/database/auth/AI integration status list
- `CallStatusPanel.jsx`    — call status legend (badges only)
- `RecentCallsTable.jsx`   — placeholder calls table; accepts a `rows` prop so a
  future module can pass real data without changing the markup
- `ActionButtons.jsx`      — reserved View/Edit/Delete/Call row actions, inert
  until a future module passes handlers — now used LIVE by Module 5's
  CustomerTable, unmodified
- `RecentActivityList.jsx` — placeholder activity feed
- `QuickActions.jsx`       — "Add Customer / Start Call / Import CSV" buttons,
  all show an "available in upcoming modules" notice

Generic primitives (Module 5):
- `Modal.jsx`          — reusable overlay dialog, used by every customer modal
- `ConfirmDialog.jsx`  — generic "are you sure" dialog (used for delete confirmation)
- `Pagination.jsx`     — reusable Prev/Next pagination control
- `ToastContainer.jsx` — renders the global toast stack (see context/ToastContext.jsx)

Customer Management (Module 5) — see `components/customers/README.md`

Products/Knowledge Base (Module 6) — see `components/products/README.md`
and `components/knowledge/README.md`. `ActionButtons.jsx` gained an
optional `visibleActions` prop (default: all four, so Module 4/5 usage
is unaffected) so these tables can omit the Call button.

Data Import (Module 7) — see `components/imports/README.md`.

AI Assistant (Module 8): no new reusable components — the page itself
(`pages/AIAssistantPage.jsx`) composes existing `Alert`/`Badge`/`Spinner`;
only `components/products/ProductViewModal.jsx` gained one "Ask AI" link.

Voice Calling (Module 9) — see `components/calls/README.md`, extended in
Module 10 with Call History components (same folder/README).

Charts (Module 10) — see `components/charts/README.md`. `StatCard.jsx`
(Module 4) and `RecentCallsList.jsx` (Module 9) are reused unmodified on
the Reports page.
