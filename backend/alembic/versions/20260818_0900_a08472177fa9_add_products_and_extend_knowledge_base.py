"""create products table and extend knowledge_base for Module 6

Revision ID: a08472177fa9
Revises: 2a98345e2924
Create Date: 2026-08-18 09:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a08472177fa9"
down_revision: Union[str, None] = "2a98345e2924"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # products
    # ------------------------------------------------------------------
    op.create_table(
        "products",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("product_code", sa.String(length=50), nullable=False),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=False),
        sa.Column("model_number", sa.String(length=100), nullable=True),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("final_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=False),
        sa.Column("warranty", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("features", sa.Text(), nullable=True),
        sa.Column("specifications", sa.Text(), nullable=True),
        sa.Column(
            "availability_status",
            sa.Enum("in_stock", "out_of_stock", "discontinued", name="productavailability"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_code", name="uq_products_product_code"),
        sa.UniqueConstraint("sku", name="uq_products_sku"),
    )
    op.create_index("ix_products_product_code", "products", ["product_code"], unique=True)
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)
    op.create_index("ix_products_product_name", "products", ["product_name"], unique=False)
    op.create_index("ix_products_category", "products", ["category"], unique=False)
    op.create_index("ix_products_brand", "products", ["brand"], unique=False)
    op.create_index("ix_products_availability_status", "products", ["availability_status"], unique=False)
    op.create_index("ix_products_category_brand", "products", ["category", "brand"], unique=False)

    # ------------------------------------------------------------------
    # knowledge_base — extend with Module 6 fields
    # ------------------------------------------------------------------
    op.add_column("knowledge_base", sa.Column("product_id", sa.BigInteger(), nullable=False))
    op.add_column("knowledge_base", sa.Column("question", sa.Text(), nullable=False))
    op.add_column("knowledge_base", sa.Column("answer", sa.Text(), nullable=False))
    op.add_column("knowledge_base", sa.Column("keywords", sa.String(length=500), nullable=True))
    op.add_column(
        "knowledge_base",
        sa.Column(
            "priority",
            sa.Enum("low", "medium", "high", name="knowledgebasepriority"),
            nullable=False,
        ),
    )
    # Module 2's `content` column is superseded by question/answer above.
    # Relaxed to nullable rather than dropped, so this migration never
    # destructively alters existing data or migration history.
    op.alter_column("knowledge_base", "content", existing_type=sa.Text(), nullable=True)

    op.create_foreign_key(
        "fk_knowledge_base_product_id_products",
        "knowledge_base",
        "products",
        ["product_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_knowledge_base_product_id", "knowledge_base", ["product_id"], unique=False)
    op.create_index("ix_knowledge_base_keywords", "knowledge_base", ["keywords"], unique=False)
    op.create_index("ix_knowledge_base_priority", "knowledge_base", ["priority"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_knowledge_base_priority", table_name="knowledge_base")
    op.drop_index("ix_knowledge_base_keywords", table_name="knowledge_base")
    op.drop_index("ix_knowledge_base_product_id", table_name="knowledge_base")
    op.drop_constraint(
        "fk_knowledge_base_product_id_products", "knowledge_base", type_="foreignkey"
    )
    op.alter_column("knowledge_base", "content", existing_type=sa.Text(), nullable=False)
    op.drop_column("knowledge_base", "priority")
    op.drop_column("knowledge_base", "keywords")
    op.drop_column("knowledge_base", "answer")
    op.drop_column("knowledge_base", "question")
    op.drop_column("knowledge_base", "product_id")

    op.drop_index("ix_products_category_brand", table_name="products")
    op.drop_index("ix_products_availability_status", table_name="products")
    op.drop_index("ix_products_brand", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_product_name", table_name="products")
    op.drop_index("ix_products_sku", table_name="products")
    op.drop_index("ix_products_product_code", table_name="products")
    op.drop_table("products")

    for enum_name in ("productavailability", "knowledgebasepriority"):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
