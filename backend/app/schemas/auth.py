"""
Auth request/response schemas.

Validation rules (email format, password length/strength, confirm-
password match) are enforced here so invalid data never reaches the
service layer — the service layer can trust that anything typed as
`RegisterRequest` / `LoginRequest` is already well-formed.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.schemas.user import UserOut
from app.utils.validators import validate_password_strength


class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be blank.")
        return value

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match.")
        return self


class RegisterResponse(BaseModel):
    """Response body for a successful registration."""

    message: str
    user: UserOut


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Response body for a successful login — the JWT plus who it belongs to."""

    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserOut
