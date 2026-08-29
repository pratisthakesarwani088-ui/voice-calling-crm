"""
Product model.

Mirrors the Customer model's shape (Module 5): soft-delete enabled,
sequential never-reused product_code, structured for search/filter/
sort/pagination. Knowledge Base entries (Module 6) link to a product
via a required foreign key.
"""

from sqlalchemy import Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import BaseModel, SoftDeleteMixin
from app.models.enums import ProductAvailability, sa_enum


class Product(Base, BaseModel, SoftDeleteMixin):
    """
    A sellable product.

    Soft-delete is enabled: products are referenced by Knowledge Base
    entries, so removing one must not silently delete that history —
    same reasoning as Customer -> Calls/FollowUps in Module 5.

    `price` and `discount` use Numeric (fixed-point), not Float, since
    they're currency values — Float's binary rounding error is not
    acceptable for money. `final_price` is computed server-side
    (price - discount, floored at 0) whenever price/discount change —
    see app.services.product_service — rather than trusted from client
    input, so it can never drift from the two values it's derived from.
    """

    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_category_brand", "category", "brand"),
    )

    product_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )

    product_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    model_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    discount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    # Computed server-side from price/discount — never accepted directly
    # from the client. See product_service.compute_final_price().
    final_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    warranty: Mapped[str | None] = mapped_column(String(100), nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    features: Mapped[str | None] = mapped_column(Text, nullable=True)

    specifications: Mapped[str | None] = mapped_column(Text, nullable=True)

    availability_status: Mapped[ProductAvailability] = mapped_column(
        sa_enum(ProductAvailability),
        default=ProductAvailability.IN_STOCK,
        nullable=False,
        index=True,
    )

    # A product's Knowledge Base entries are owned by it — see
    # KnowledgeBase.product_id (ON DELETE CASCADE). Same safety-net
    # reasoning as Customer -> Calls/FollowUps: normal deletion is
    # soft-delete, which does not touch these rows at all.
    knowledge_entries: Mapped[list["KnowledgeBase"]] = relationship(
        "KnowledgeBase",
        back_populates="product",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<Product id={self.id} code={self.product_code!r} sku={self.sku!r}>"
