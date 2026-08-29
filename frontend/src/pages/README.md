# pages/

Top-level route components, one per screen.

- `HomePage.jsx`     — public landing page (Module 1 backend check + Module 4 branding)
- `NotFoundPage.jsx` — 404
- `LoginPage.jsx`     — Module 3
- `SignupPage.jsx`    — Module 3 (creates the single Admin account)
- `DashboardPage.jsx` — Module 4: the real dashboard UI (stats, system status,
  call status, recent calls, recent activity, quick actions) — UI only, no
  backend queries
- `ComingSoonPage.jsx` — removed: every sidebar section now has a real page
  (Customers/Products/Knowledge Base/Import/AI Assistant/Calls/Call History/
  Reports/Settings), so this Module 4 placeholder had no remaining route to
  render and was deleted as dead code.
- `CustomersPage.jsx` — Module 5: full Customer Management page — table,
  search/filter/sort, pagination, and the Add/Edit/View/Delete flows
- `ProductsPage.jsx` — Module 6: full Product Management page
- `KnowledgeBasePage.jsx` — Module 6: full Knowledge Base Management page,
  linked to products
- `ImportCenterPage.jsx` — Module 7: bulk CSV/Excel import for Customers,
  Products, and Knowledge Base
- `AIAssistantPage.jsx` — Module 8: Gemini-powered AI Assistant grounded in
  product/knowledge base/customer data
- `VoiceCallingPage.jsx` — Module 9: Demo/Real voice calling, reachable via the
  Sidebar's pre-existing "Calls" entry and the Customers table's Call action
- `CallHistoryPage.jsx` — Module 10: search/filter/paginate/view/delete every
  saved call, reachable via a "View All" link on the Voice Calling page
- `ReportsPage.jsx` — Module 10: dashboard statistics and charts, reachable
  via the Sidebar's pre-existing "Reports" entry
