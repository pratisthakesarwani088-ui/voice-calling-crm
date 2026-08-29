"""
Model registry.

Importing every model here guarantees they're all registered on
`Base.metadata` as soon as `app.models` is imported anywhere — which is
what makes Alembic's `--autogenerate` (see alembic/env.py) and
`Base.metadata.create_all()` see the full schema instead of only
whichever single model file happened to be imported directly.
"""

from app.models.base import BaseModel, CreatedAtMixin, IDMixin, SoftDeleteMixin, utcnow
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.knowledge_base import KnowledgeBase
from app.models.call import Call
from app.models.follow_up import FollowUp
from app.models.report import Report
from app.models.app_settings import AppSettings

__all__ = [
    "BaseModel",
    "CreatedAtMixin",
    "IDMixin",
    "SoftDeleteMixin",
    "utcnow",
    "User",
    "Customer",
    "Product",
    "KnowledgeBase",
    "Call",
    "FollowUp",
    "Report",
    "AppSettings",
]
