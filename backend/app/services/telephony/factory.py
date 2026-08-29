"""
Telephony provider factory.

The single place that maps a TelephonyProvider enum value to its
concrete provider class - callers (e.g. app/services/settings_service.py)
never branch on the provider type themselves.
"""

from app.models.enums import TelephonyProvider
from app.services.telephony.base import BaseTelephonyProvider
from app.services.telephony.exotel_provider import ExotelProvider
from app.services.telephony.twilio_provider import TwilioProvider

_PROVIDER_CLASSES: dict[TelephonyProvider, type[BaseTelephonyProvider]] = {
    TelephonyProvider.TWILIO: TwilioProvider,
    TelephonyProvider.EXOTEL: ExotelProvider,
}


def create_provider(
    provider: TelephonyProvider,
    account_id: str,
    auth_token: str,
    caller_number: str | None = None,
) -> BaseTelephonyProvider:
    """Instantiate the right provider class for `provider`. Raises ValueError for an unknown provider."""
    provider_class = _PROVIDER_CLASSES.get(provider)
    if provider_class is None:
        raise ValueError(f"Unknown telephony provider: {provider}")
    return provider_class(
        account_id=account_id, auth_token=auth_token, caller_number=caller_number
    )
