"""
Exotel telephony provider.
"""

import httpx

from app.services.telephony.base import BaseTelephonyProvider

_TIMEOUT_SECONDS = 10.0
_EXOTEL_API_HOST = "https://api.exotel.com"


class ExotelProvider(BaseTelephonyProvider):
    def _base_url(self) -> str:
        return f"{_EXOTEL_API_HOST}/v1/Accounts/{self.account_id}"

    async def test_connection(self) -> tuple[bool, str]:
        url = self._base_url()
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                response = await client.get(url, auth=(self.account_id, self.auth_token))
        except httpx.TimeoutException:
            return False, "Exotel did not respond in time."
        except httpx.RequestError as exc:
            return False, f"Could not reach Exotel: {exc}"

        if response.status_code in (401, 403):
            return False, "Exotel rejected these credentials."
        if response.status_code >= 400:
            return False, f"Exotel returned an error (status {response.status_code})."
        return True, "Exotel connection successful."

    async def place_call(self, to_number: str) -> tuple[bool, str]:
        if not self.caller_number:
            return False, "No caller number configured for Exotel."

        url = f"{self._base_url()}/Calls/connect.json"
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    url,
                    auth=(self.account_id, self.auth_token),
                    data={
                        "From": self.caller_number,
                        "To": to_number,
                        "CallerId": self.caller_number,
                    },
                )
        except httpx.TimeoutException:
            return False, "Exotel did not respond in time."
        except httpx.RequestError as exc:
            return False, f"Could not reach Exotel: {exc}"

        if response.status_code >= 400:
            return False, f"Exotel call request failed (status {response.status_code})."
        return True, "Call placed via Exotel."