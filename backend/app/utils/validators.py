"""
Reusable validation helpers.

Used by Pydantic schemas (see app/schemas/auth.py) so validation rules
are defined once and can be unit tested independently of Pydantic.
"""

import re

_UPPERCASE_RE = re.compile(r"[A-Z]")
_LOWERCASE_RE = re.compile(r"[a-z]")
_DIGIT_RE = re.compile(r"\d")
_SPECIAL_CHAR_RE = re.compile(r"[^\w\s]")

# Accepts digits with optional leading +, and spaces/hyphens/parentheses
# as separators (e.g. "+1 (415) 555-0132") — permissive on formatting
# since phone formats vary by country, but still rejects obviously
# invalid input (letters, too short/long).
_PHONE_RE = re.compile(r"^\+?[0-9()\-\s]{7,20}$")
_PHONE_DIGITS_RE = re.compile(r"\d")

PASSWORD_MIN_LENGTH = 8


def validate_password_strength(password: str) -> str:
    """
    Enforce a minimum password strength policy.

    Requires at least PASSWORD_MIN_LENGTH characters, one uppercase
    letter, one lowercase letter, one digit, and one special character.
    Returns the password unchanged if valid; raises ValueError
    (with a user-facing message) otherwise.
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters long."
        )
    if not _UPPERCASE_RE.search(password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not _LOWERCASE_RE.search(password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not _DIGIT_RE.search(password):
        raise ValueError("Password must contain at least one digit.")
    if not _SPECIAL_CHAR_RE.search(password):
        raise ValueError("Password must contain at least one special character.")
    return password


def validate_required_text(value: str, field_label: str, max_length: int = 255) -> str:
    """
    Trim and reject blank/oversized text for a required field.

    Shared by every "required text" field across the app (customer name,
    phone) so the same rule — trim, reject empty, enforce a max length —
    isn't reimplemented per field.
    """
    value = value.strip()
    if not value:
        raise ValueError(f"{field_label} is required.")
    if len(value) > max_length:
        raise ValueError(f"{field_label} must be at most {max_length} characters.")
    return value


def validate_phone(value: str) -> str:
    """
    Trim and validate a phone number's shape.

    Deliberately permissive on formatting (digits plus +, spaces,
    hyphens, parentheses) since valid formats vary by country — but
    still rejects blank input, letters, and unreasonable lengths.
    Uniqueness is enforced separately, at the database/service layer
    (see app.services.customer_service), not here.
    """
    value = value.strip()
    if not value:
        raise ValueError("Phone number is required.")
    if not _PHONE_RE.match(value):
        raise ValueError("Enter a valid phone number.")
    digit_count = len(_PHONE_DIGITS_RE.findall(value))
    if digit_count < 7:
        raise ValueError("Phone number must contain at least 7 digits.")
    return value
