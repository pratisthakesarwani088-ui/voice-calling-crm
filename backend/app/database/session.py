"""
SQLAlchemy engine and session configuration.

This module wires up the database connection using the URL supplied via
environment variables (see app.config.settings). No tables or models are
defined in Module 1 — this is purely the connection foundation that later
modules will build on.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config.settings import settings

# `pool_pre_ping` avoids "MySQL server has gone away" errors on long-lived
# connections (common with MySQL after idle timeouts) — important for
# Render's managed database connections.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base — all future ORM models inherit from this."""
    pass


def get_db():
    """
    FastAPI dependency that yields a database session per request and
    guarantees it is closed afterwards, even if an error occurs.

    Usage (in a future module):
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
