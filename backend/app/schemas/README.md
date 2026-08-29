# schemas/

Pydantic request/response schemas, separate from the SQLAlchemy models
in `models/` so the API contract can evolve independently of the DB
schema.

- `user.py`, `auth.py`, `common.py` — auth (Module 3)
- `customer.py` — Customer Management (Module 5)
- `product.py` — Product Management (Module 6)
- `knowledge_base.py` — Knowledge Base (Module 6)
- `import_schemas.py` — Data Import preview/summary response shapes (Module 7)
- `ai.py` — AI Assistant request/response shapes (Module 8)
- `call.py` — Voice Calling request/response shapes (Module 9); list
  response extended with pagination for Call History (Module 10)
- `report.py` — Reports response shapes (Module 10)
