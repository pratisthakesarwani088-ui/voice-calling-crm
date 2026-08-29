"""create core CRM tables (users, customers, knowledge_base, calls, follow_ups, reports)

Revision ID: ee1f2eff4471
Revises:
Create Date: 2026-08-16 12:47:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "ee1f2eff4471"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "manager", "agent", name="userrole"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "suspended", name="userstatus"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"], unique=False)
    op.create_index("ix_users_status", "users", ["status"], unique=False)

    # ------------------------------------------------------------------
    # customers
    # ------------------------------------------------------------------
    op.create_table(
        "customers",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("customer_code", sa.String(length=50), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("company", sa.String(length=150), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "blocked", name="customerstatus"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_code", name="uq_customers_customer_code"),
        sa.UniqueConstraint("phone", name="uq_customers_phone"),
    )
    op.create_index(
        "ix_customers_customer_code", "customers", ["customer_code"], unique=True
    )
    op.create_index("ix_customers_phone", "customers", ["phone"], unique=True)
    op.create_index("ix_customers_status", "customers", ["status"], unique=False)
    op.create_index(
        "ix_customers_full_name", "customers", ["full_name"], unique=False
    )
    op.create_index(
        "ix_customers_city_state", "customers", ["city", "state"], unique=False
    )

    # ------------------------------------------------------------------
    # knowledge_base
    # ------------------------------------------------------------------
    op.create_table(
        "knowledge_base",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "published", "archived", name="knowledgebasestatus"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_knowledge_base_title", "knowledge_base", ["title"], unique=False
    )
    op.create_index(
        "ix_knowledge_base_category", "knowledge_base", ["category"], unique=False
    )
    op.create_index(
        "ix_knowledge_base_status", "knowledge_base", ["status"], unique=False
    )
    op.create_index(
        "ix_knowledge_base_category_status",
        "knowledge_base",
        ["category", "status"],
        unique=False,
    )

    # ------------------------------------------------------------------
    # calls
    # ------------------------------------------------------------------
    op.create_table(
        "calls",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("customer_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "call_type",
            sa.Enum("outbound", "inbound", name="calltype"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "queued",
                "in_progress",
                "completed",
                "failed",
                "missed",
                "cancelled",
                name="callstatus",
            ),
            nullable=False,
        ),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("recording_url", sa.String(length=500), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column(
            "sentiment",
            sa.Enum(
                "positive", "neutral", "negative", "unknown", name="callsentiment"
            ),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            name="fk_calls_customer_id_customers",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_calls_customer_id", "calls", ["customer_id"], unique=False)
    op.create_index("ix_calls_call_type", "calls", ["call_type"], unique=False)
    op.create_index("ix_calls_status", "calls", ["status"], unique=False)
    op.create_index("ix_calls_sentiment", "calls", ["sentiment"], unique=False)
    op.create_index(
        "ix_calls_customer_started",
        "calls",
        ["customer_id", "started_at"],
        unique=False,
    )
    op.create_index(
        "ix_calls_status_type", "calls", ["status", "call_type"], unique=False
    )

    # ------------------------------------------------------------------
    # follow_ups
    # ------------------------------------------------------------------
    op.create_table(
        "follow_ups",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("customer_id", sa.BigInteger(), nullable=False),
        sa.Column("followup_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "completed", "cancelled", name="followupstatus"),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            name="fk_follow_ups_customer_id_customers",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_follow_ups_customer_id", "follow_ups", ["customer_id"], unique=False
    )
    op.create_index(
        "ix_follow_ups_followup_date", "follow_ups", ["followup_date"], unique=False
    )
    op.create_index("ix_follow_ups_status", "follow_ups", ["status"], unique=False)
    op.create_index(
        "ix_follow_ups_customer_date",
        "follow_ups",
        ["customer_id", "followup_date"],
        unique=False,
    )

    # ------------------------------------------------------------------
    # reports
    # ------------------------------------------------------------------
    op.create_table(
        "reports",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column(
            "report_type",
            sa.Enum(
                "call_summary",
                "customer_summary",
                "agent_performance",
                "custom",
                name="reporttype",
            ),
            nullable=False,
        ),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("generated_by", sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(
            ["generated_by"],
            ["users.id"],
            name="fk_reports_generated_by_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_reports_report_type", "reports", ["report_type"], unique=False
    )
    op.create_index(
        "ix_reports_generated_at", "reports", ["generated_at"], unique=False
    )
    op.create_index(
        "ix_reports_generated_by", "reports", ["generated_by"], unique=False
    )
    op.create_index(
        "ix_reports_type_generated_at",
        "reports",
        ["report_type", "generated_at"],
        unique=False,
    )


def downgrade() -> None:
    # Drop in reverse dependency order (children before parents).
    op.drop_index("ix_reports_type_generated_at", table_name="reports")
    op.drop_index("ix_reports_generated_by", table_name="reports")
    op.drop_index("ix_reports_generated_at", table_name="reports")
    op.drop_index("ix_reports_report_type", table_name="reports")
    op.drop_table("reports")

    op.drop_index("ix_follow_ups_customer_date", table_name="follow_ups")
    op.drop_index("ix_follow_ups_status", table_name="follow_ups")
    op.drop_index("ix_follow_ups_followup_date", table_name="follow_ups")
    op.drop_index("ix_follow_ups_customer_id", table_name="follow_ups")
    op.drop_table("follow_ups")

    op.drop_index("ix_calls_status_type", table_name="calls")
    op.drop_index("ix_calls_customer_started", table_name="calls")
    op.drop_index("ix_calls_sentiment", table_name="calls")
    op.drop_index("ix_calls_status", table_name="calls")
    op.drop_index("ix_calls_call_type", table_name="calls")
    op.drop_index("ix_calls_customer_id", table_name="calls")
    op.drop_table("calls")

    op.drop_index("ix_knowledge_base_category_status", table_name="knowledge_base")
    op.drop_index("ix_knowledge_base_status", table_name="knowledge_base")
    op.drop_index("ix_knowledge_base_category", table_name="knowledge_base")
    op.drop_index("ix_knowledge_base_title", table_name="knowledge_base")
    op.drop_table("knowledge_base")

    op.drop_index("ix_customers_city_state", table_name="customers")
    op.drop_index("ix_customers_full_name", table_name="customers")
    op.drop_index("ix_customers_status", table_name="customers")
    op.drop_index("ix_customers_phone", table_name="customers")
    op.drop_index("ix_customers_customer_code", table_name="customers")
    op.drop_table("customers")

    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # Drop native MySQL ENUM types explicitly. MySQL implements
    # SQLAlchemy's Enum as an inline column type (not a separate CREATE
    # TYPE), so dropping the tables above already removes them — this is
    # a no-op on MySQL but kept here for portability if the project is
    # ever pointed at PostgreSQL, where Enum *is* a standalone type.
    for enum_name in (
        "userrole",
        "userstatus",
        "customerstatus",
        "knowledgebasestatus",
        "calltype",
        "callstatus",
        "callsentiment",
        "followupstatus",
        "reporttype",
    ):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
