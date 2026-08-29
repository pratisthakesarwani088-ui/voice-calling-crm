"""extend calls table for Module 9 hybrid voice calling

Revision ID: 841762267d5e
Revises: a08472177fa9
Create Date: 2026-08-19 09:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "841762267d5e"
down_revision: Union[str, None] = "a08472177fa9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "calls",
        sa.Column("product_id", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "calls",
        sa.Column(
            "mode",
            sa.Enum("demo", "real", name="callmode"),
            nullable=False,
        ),
    )
    op.add_column(
        "calls",
        sa.Column("external_call_id", sa.String(length=100), nullable=True),
    )

    op.create_foreign_key(
        "fk_calls_product_id_products",
        "calls",
        "products",
        ["product_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_calls_product_id", "calls", ["product_id"], unique=False)
    op.create_index("ix_calls_mode", "calls", ["mode"], unique=False)
    op.create_index("ix_calls_external_call_id", "calls", ["external_call_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_calls_external_call_id", table_name="calls")
    op.drop_index("ix_calls_mode", table_name="calls")
    op.drop_index("ix_calls_product_id", table_name="calls")
    op.drop_constraint("fk_calls_product_id_products", "calls", type_="foreignkey")

    op.drop_column("calls", "external_call_id")
    op.drop_column("calls", "mode")
    op.drop_column("calls", "product_id")

    sa.Enum(name="callmode").drop(op.get_bind(), checkfirst=True)
