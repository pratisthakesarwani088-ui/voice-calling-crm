"""add soft delete columns to calls for Module 10

Revision ID: dfaded6abb5f
Revises: 841762267d5e
Create Date: 2026-08-20 09:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "dfaded6abb5f"
down_revision: Union[str, None] = "841762267d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "calls",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "calls",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Drop the server_default once existing rows are backfilled - new
    # inserts always supply is_deleted explicitly via the ORM default,
    # matching how every other soft-deleted table (customers, products,
    # knowledge_base) is defined.
    op.alter_column("calls", "is_deleted", server_default=None)
    op.create_index("ix_calls_is_deleted", "calls", ["is_deleted"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_calls_is_deleted", table_name="calls")
    op.drop_column("calls", "deleted_at")
    op.drop_column("calls", "is_deleted")
