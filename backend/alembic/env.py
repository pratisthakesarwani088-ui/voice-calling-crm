"""
Alembic environment script.

Reads the database URL from environment variables (via app.config.settings)
instead of alembic.ini, so migrations always target the same database as
the running application — in dev, CI, or Render.
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make the `app` package importable when running `alembic` from backend/
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config.settings import settings
from app.database.session import Base

# Import the model registry so every model in app/models/ is registered
# on Base.metadata before Alembic inspects it. Without this import,
# `target_metadata` below would be empty and --autogenerate would see
# no tables at all.
import app.models  # noqa: F401

# Alembic Config object, provides access to values in alembic.ini
config = context.config

# Inject the real database URL from environment variables
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support.
# Populated as of Module 2 — every model registered via app/models/__init__.py
# (imported above) is now visible here.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL only)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
