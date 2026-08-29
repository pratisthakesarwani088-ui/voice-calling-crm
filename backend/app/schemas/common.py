"""
Small, generic response schemas reusable across any route — not just
auth. Keeping these here (rather than duplicating a "message" field
shape in every schema file) is what "no duplicate code" means in
practice for the schemas layer.
"""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """A simple {"message": "..."} response body."""

    message: str
