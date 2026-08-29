"""
Custom domain exceptions.

Services raise these plain Python exceptions instead of FastAPI's
HTTPException, so the service layer stays framework-agnostic (easy to
unit test without spinning up a FastAPI app) and reusable outside an
HTTP context. Routes catch these and translate them into the
appropriate HTTP response — see app/routes/auth.py.
"""


class AppError(Exception):
    """Base class for all custom application errors."""

    pass


class EmailAlreadyExistsError(AppError):
    """Raised when registering with an email that's already in use."""

    pass


class RegistrationClosedError(AppError):
    """
    Raised when someone attempts to register after the single admin
    account already exists.

    This CRM is a single-user application — only one Admin account is
    supported, so registration is only allowed once, to create that
    first account.
    """

    pass


class InvalidCredentialsError(AppError):
    """Raised when login email/password don't match any active account."""

    pass


class InactiveAccountError(AppError):
    """Raised when a recognized account is not in ACTIVE status."""

    pass


class InvalidTokenError(AppError):
    """Raised when a JWT is missing, malformed, expired, or invalid."""

    pass


class DuplicatePhoneError(AppError):
    """Raised when creating/updating a customer with a phone already in use."""

    pass


class CustomerNotFoundError(AppError):
    """Raised when a customer id doesn't match any (non-deleted) row."""

    pass


class DuplicateSkuError(AppError):
    """Raised when creating/updating a product with a SKU already in use."""

    pass


class ProductNotFoundError(AppError):
    """Raised when a product id doesn't match any (non-deleted) row."""

    pass


class KnowledgeEntryNotFoundError(AppError):
    """Raised when a knowledge base entry id doesn't match any (non-deleted) row."""

    pass


class CallNotFoundError(AppError):
    """Raised when a call id doesn't match any row."""

    pass


class InvalidFileError(AppError):
    """Raised when an uploaded import file has a disallowed type, is too large, or is unreadable."""

    pass


class AIConfigurationError(AppError):
    """Raised when the Gemini API key isn't configured — fails fast with a clear message instead of a confusing upstream auth error."""

    pass


class AITimeoutError(AppError):
    """Raised when the Gemini API doesn't respond within GEMINI_TIMEOUT_SECONDS."""

    pass


class AIServiceError(AppError):
    """Raised for any other Gemini API failure — a non-2xx response, a network error, or a malformed/unexpected response shape."""

    pass


class VoiceCallConfigurationError(AppError):
    """Raised when Real Call mode is requested but Vapi/ElevenLabs aren't fully configured, or the configured key is rejected."""

    pass


class VoiceCallTimeoutError(AppError):
    """Raised when Vapi doesn't respond within VAPI_TIMEOUT_SECONDS."""

    pass


class VoiceCallServiceError(AppError):
    """Raised for any other Vapi failure — a non-2xx response, a network error, or a malformed/unexpected response shape."""

    pass


class InvalidCurrentPasswordError(AppError):
    """Raised when Change Password's supplied current password doesn't match."""

    pass
