"""create app_settings table for Module 11

Revision ID: 3c3f6b0ef7a2
Revises: dfaded6abb5f
Create Date: 2026-08-21 09:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "3c3f6b0ef7a2"
down_revision: Union[str, None] = "dfaded6abb5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("company_name", sa.String(length=150), nullable=False),
        sa.Column("company_logo_url", sa.String(length=500), nullable=True),
        sa.Column("timezone", sa.String(length=50), nullable=False),
        sa.Column("gemini_api_key", sa.String(length=255), nullable=True),
        sa.Column("gemini_model", sa.String(length=100), nullable=True),
        sa.Column("vapi_api_key", sa.String(length=255), nullable=True),
        sa.Column("vapi_assistant_id", sa.String(length=100), nullable=True),
        sa.Column("elevenlabs_api_key", sa.String(length=255), nullable=True),
        sa.Column("elevenlabs_voice_id", sa.String(length=100), nullable=True),
        sa.Column(
            "telephony_provider",
            sa.Enum("twilio", "exotel", name="telephonyprovider"),
            nullable=False,
        ),
        sa.Column("telephony_account_id", sa.String(length=255), nullable=True),
        sa.Column("telephony_auth_token", sa.String(length=255), nullable=True),
        sa.Column("telephony_caller_number", sa.String(length=30), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
    sa.Enum(name="telephonyprovider").drop(op.get_bind(), checkfirst=True)
