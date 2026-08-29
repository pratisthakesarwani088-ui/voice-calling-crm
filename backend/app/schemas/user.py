"""
User-related response schemas.

`UserOut` is the single, reusable "safe to send to the client" view of
a User row — it deliberately excludes `password_hash` and `is_deleted`.
Any future module that returns user data (e.g. a "who generated this
report" field) should reuse this schema instead of redefining it.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole, UserStatus


class UserOut(BaseModel):
    """Public-facing representation of a User."""

    id: int
    full_name: str
    email: str
    role: UserRole
    status: UserStatus
    created_at: datetime

    # Lets Pydantic build this schema directly from a SQLAlchemy User
    # instance (`UserOut.model_validate(user)`), instead of manually
    # mapping each field.
    model_config = ConfigDict(from_attributes=True)
