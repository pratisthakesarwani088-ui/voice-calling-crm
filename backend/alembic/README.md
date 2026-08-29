# alembic/

Database migration environment (Alembic). `env.py` reads `DATABASE_URL`
from environment variables, so migrations always target the correct
database in dev, CI, or Render.

No migrations exist yet in Module 1 — `versions/` is empty until models
are introduced in a future module. Once models exist, generate a
migration with:

    alembic revision --autogenerate -m "description"
    alembic upgrade head
