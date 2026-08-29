# utils/

Small, reusable, stateless helper functions shared across the backend.

- `security.py` — password hashing (bcrypt) and JWT encode/decode
- `validators.py` — reusable validation rules (password strength, phone, required text)
- `exceptions.py` — custom domain exceptions raised by services, translated to HTTP in routes
- `code_generator.py` — shared sequential code generator (CUS/PRD-style), used by
  customer_service and product_service so the algorithm isn't duplicated (Module 6)
- `file_parsing.py` — CSV/Excel upload parsing + file validation (Module 7)
