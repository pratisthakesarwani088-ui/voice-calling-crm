# routes/

API route definitions, grouped by feature. Routes stay thin: validate
via Pydantic, call a service, map any domain exception to an HTTP
response.

- `health.py` — liveness/readiness probe (Module 1)
- `auth.py` — register / login / logout / me (Module 3)
- `customers.py` — Customer Management CRUD (Module 5)
- `products.py` — Product Management CRUD (Module 6)
- `knowledge_base.py` — Knowledge Base CRUD (Module 6)
- `imports.py` — CSV/Excel bulk import for Customers/Products/Knowledge Base (Module 7)
- `ai.py` — Gemini-powered AI Assistant, grounded in database data (Module 8)
- `calls.py` — Hybrid Voice Calling: start/status/end (Module 9); list/get/
  delete extended for Call History search/filter/pagination/soft-delete (Module 10)
- `reports.py` — dashboard statistics and call analytics (Module 10)
