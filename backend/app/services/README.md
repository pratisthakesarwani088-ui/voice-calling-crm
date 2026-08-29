# services/

Business logic lives here, not in routes. Routes stay thin; services
raise custom exceptions (`app/utils/exceptions.py`) on failure instead
of FastAPI's `HTTPException`, keeping them framework-agnostic.

- `auth_service.py` — registration (single-admin only) and login
- `customer_service.py` — Customer Management CRUD/search/filter/sort/pagination
- `product_service.py` — Product Management CRUD/search/filter/sort/pagination (Module 6)
- `knowledge_service.py` — Knowledge Base CRUD/search/filter/sort/pagination (Module 6)
- `import_service.py` — generic import engine (validate/dedup/create/update rows), reused by all three entities (Module 7)
- `import_config.py` — per-entity import config, wires the engine to each entity's existing Create schema and service functions (Module 7)
- `template_service.py` — sample CSV/Excel template generation (Module 7)
- `ai_service.py` — low-level, reusable Gemini text generation (Module 8) — the
  only file that talks to the Gemini API directly; reusable as-is by a future
  Voice Calling module
- `ai_context_service.py` — reads Product/Customer/Knowledge Base data and
  builds a grounded prompt for ai_service (Module 8) — no RAG/embeddings.
  Its formatting helpers are public and reused by call_service.py (Module 9).
- `voice_call_service.py` — low-level, reusable Vapi calling (Module 9) —
  the only file that talks to Vapi directly; ElevenLabs is configured as
  Vapi's voice provider, never called directly by this backend
- `call_service.py` — Demo Call (Gemini-simulated) and Real Call (Vapi)
  orchestration, saves every call to the Calls table (Module 9). Its
  `list_calls` also powers Call History's search/filter/pagination and
  soft delete (Module 10).
- `report_service.py` — dashboard statistics and calls-by-period, pure
  aggregate SQL over the Calls table, no fake data (Module 10)
