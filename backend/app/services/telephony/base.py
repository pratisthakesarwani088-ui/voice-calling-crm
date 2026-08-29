"""
Telephony provider abstraction (Module 12).

BaseTelephonyProvider defines the interface every raw telephony carrier
(Twilio, Exotel, ...) implements consistently - test_connection() and
place_call(). This is distinct from Vapi (app/services/voice_call_service.py),
which orchestrates the AI conversation itself; a telephony provider is
the underlying carrier a phone number is provisioned through. Adding a
third provider later means one new file implementing this interface,
not touching any existing provider or the factory's callers.
"""

from abc import ABC, abstractmethod


class BaseTelephonyProvider(ABC):
    def __init__(self, account_id: str, auth_token: str, caller_number: str | None = None):
        self.account_id = account_id
        self.auth_token = auth_token
        self.caller_number = caller_number

    @abstractmethod
    async def test_connection(self) -> tuple[bool, str]:
        """Verify the configured credentials are valid. Returns (success, message)."""
        raise NotImplementedError

    @abstractmethod
    async def place_call(self, to_number: str) -> tuple[bool, str]:
        """Place an outbound call to `to_number`. Returns (success, message)."""
        raise NotImplementedError
