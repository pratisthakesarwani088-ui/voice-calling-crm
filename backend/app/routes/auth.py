"""
Authentication routes.

Deliberately thin: each endpoint validates nothing itself (Pydantic
schemas already did that), calls into app.services.auth_service for the
actual logic, and translates the service's domain exceptions into the
appropriate HTTP status code. No business logic lives in this file.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, RegisterResponse, TokenResponse
from app.schemas.common import MessageResponse
from app.schemas.user import UserOut
from app.services.auth_service import authenticate_user, register_user
from app.utils.exceptions import (
    EmailAlreadyExistsError,
    InactiveAccountError,
    InvalidCredentialsError,
    RegistrationClosedError,
)
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create the CRM's single Admin account.

    This CRM is single-user: registration only succeeds once, to create
    the one Admin account. Every subsequent call returns 403.
    """
    try:
        user = register_user(db, payload)
    except RegistrationClosedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return RegisterResponse(
        message="Account created successfully. You can now log in.",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email + password and receive a JWT access token."""
    try:
        user = authenticate_user(db, payload)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InactiveAccountError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    """
    Log out the current user.

    JWTs are stateless and this project does not maintain a server-side
    token blacklist/session store (that would be a meaningful addition
    of its own, out of scope for this module). This endpoint exists so
    the frontend has a single, authenticated call to make on logout, but
    the token is only actually invalidated by the client discarding it.
    A token issued before logout remains technically valid, on this
    server, until it expires — see docs/authentication.md for details
    and how to harden this later if needed.
    """
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserOut.model_validate(current_user)
