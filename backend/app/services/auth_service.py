"""
Auth service — business logic only.

No FastAPI imports here on purpose: this module takes a DB session and
plain Python/Pydantic inputs and returns plain Python objects, raising
the custom exceptions from app.utils.exceptions on failure. That keeps
it framework-agnostic and easy to unit test. Routes (app/routes/auth.py)
are the only place these exceptions get translated into HTTP responses.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils.exceptions import (
    EmailAlreadyExistsError,
    InactiveAccountError,
    InvalidCredentialsError,
    InvalidCurrentPasswordError,
    RegistrationClosedError,
)
from app.utils.security import hash_password, verify_password


def _normalize_email(email: str) -> str:
    """Store/compare emails case-insensitively to avoid duplicate-looking accounts."""
    return email.strip().lower()


def register_user(db: Session, payload: RegisterRequest) -> User:
    """
    Create the CRM's single Admin account.

    This CRM is a single-user application — only one Admin account is
    ever supported. Registration is only allowed while zero users exist;
    once the first account is created, this raises
    RegistrationClosedError for every subsequent attempt. There is no
    invite/role-management/multi-account flow in this or any module.
    """
    # Counts ALL rows, including soft-deleted ones on purpose: this
    # table must never hold more than the one Admin account, so even a
    # soft-deleted row still blocks a second registration rather than
    # silently allowing a "replacement" account.
    existing_user_count = db.execute(select(func.count()).select_from(User)).scalar_one()
    if existing_user_count > 0:
        raise RegistrationClosedError(
            "Registration is closed. This system supports a single Admin account only."
        )

    email = _normalize_email(payload.email)

    # Defensive check in addition to the DB's unique constraint, so the
    # API can return a clean 409 instead of surfacing a raw DB error.
    already_exists = db.execute(
        select(User.id).where(User.email == email)
    ).scalar_one_or_none()
    if already_exists is not None:
        raise EmailAlreadyExistsError(f"An account with email '{email}' already exists.")

    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    """
    Verify login credentials and return the matching active user.

    Raises InvalidCredentialsError for both "no such email" and "wrong
    password" — using the same generic error for both is deliberate, so
    a failed login never reveals whether the email exists.
    """
    email = _normalize_email(payload.email)

    user = db.execute(
        select(User).where(User.email == email, User.is_deleted.is_(False))
    ).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError("Invalid email or password.")

    if user.status != UserStatus.ACTIVE:
        raise InactiveAccountError("This account is not active.")

    return user


def get_active_user_by_id(db: Session, user_id: int) -> User | None:
    """Look up a non-deleted user by id — used by the auth dependency."""
    return db.execute(
        select(User).where(User.id == user_id, User.is_deleted.is_(False))
    ).scalar_one_or_none()


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    """
    Change the current user's password (Module 11's Settings > Security).

    Reuses the exact hash_password/verify_password functions register_user
    and authenticate_user already use — no new password-hashing logic.
    """
    if not verify_password(current_password, user.password_hash):
        raise InvalidCurrentPasswordError("Current password is incorrect.")

    user.password_hash = hash_password(new_password)
    db.commit()
