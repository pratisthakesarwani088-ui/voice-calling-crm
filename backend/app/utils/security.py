"""
Security primitives: password hashing and JWT encode/decode.

Kept dependency-free from FastAPI and the database on purpose — these
are pure, reusable helper functions that the service layer and the auth
dependency both build on. All secrets/expiry values come from
app.config.settings (which itself reads from environment variables) —
nothing here is hardcoded.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config.settings import settings
from app.utils.exceptions import InvalidTokenError

# A single, shared CryptContext. bcrypt is intentionally the only scheme
# configured — this is what makes `verify()` reject any hash that isn't
# a bcrypt hash, rather than silently accepting a weaker one.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt. Never store the plaintext."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return _pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    """
    Create a signed JWT access token.

    `subject` should be a stable, unique identifier for the user (their
    id, as a string — JWT's `sub` claim is required to be a string).
    Expiration is read from settings.ACCESS_TOKEN_EXPIRE_MINUTES, and
    the token is signed with settings.SECRET_KEY / settings.ALGORITHM —
    both environment-driven, never hardcoded.
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "iat": now,
        "exp": expires_at,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.

    Raises InvalidTokenError (never a raw jose exception) if the token
    is missing, malformed, expired, or signed with the wrong key — this
    keeps the auth dependency's error handling in one place.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except JWTError as exc:
        raise InvalidTokenError("Invalid or expired authentication token") from exc

    if payload.get("type") != "access":
        raise InvalidTokenError("Invalid token type")

    return payload
