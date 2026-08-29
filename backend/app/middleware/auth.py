"""
Authentication dependency ("protected route" mechanism).

`get_current_user` is a FastAPI dependency: any route that adds
`current_user: User = Depends(get_current_user)` to its signature
becomes a protected route — FastAPI runs this dependency first and
rejects the request with 401 before the route body ever executes if the
token is missing, invalid, expired, or belongs to a non-active user.

This is the one file in the auth stack that's allowed to import FastAPI
directly (alongside app/routes/auth.py) — everything it calls into
(app.services.auth_service, app.utils.security) stays framework-free.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.models.enums import UserStatus
from app.models.user import User
from app.services.auth_service import get_active_user_by_id
from app.utils.exceptions import InvalidTokenError
from app.utils.security import decode_access_token

# `tokenUrl` only affects the Swagger UI's "Authorize" button — it tells
# /docs where to send the login request. It does not perform any
# routing itself.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=True
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the currently authenticated user from a Bearer JWT.

    Raises 401 for any credential problem (missing/invalid/expired
    token, or a token for a user that no longer exists) and 403 if the
    account exists but isn't active — mirroring the distinction used in
    auth_service.authenticate_user.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except InvalidTokenError:
        raise unauthorized

    subject = payload.get("sub")
    if subject is None:
        raise unauthorized

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise unauthorized

    user = get_active_user_by_id(db, user_id)
    if user is None:
        raise unauthorized

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active.",
        )

    return user
