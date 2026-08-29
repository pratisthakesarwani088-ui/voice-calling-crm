"""add country column to customers

Revision ID: 2a98345e2924
Revises: ee1f2eff4471
Create Date: 2026-08-17 09:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "2a98345e2924"
down_revision: Union[str, None] = "ee1f2eff4471"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "customers",
        sa.Column("country", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("customers", "country")
