"""
Shared enum types.

Defined once here and reused across model files so the same set of
valid values is enforced consistently at the database level (SQLAlchemy
maps these to native MySQL ENUM columns) and is easy to import in
future schemas/services modules without duplicating string literals.
"""

import enum

from sqlalchemy import Enum as SAEnum


def sa_enum(enum_cls: type[enum.Enum], **kwargs) -> SAEnum:
    """
    Build a SQLAlchemy `Enum` column type that stores each member's
    *value* (e.g. "admin") in the database rather than its *name*
    (e.g. "ADMIN"), which is SQLAlchemy's default and easy to miss.

    Using this helper everywhere (instead of calling `Enum(...)`
    directly in each model) guarantees every enum column in the schema
    behaves the same way and matches the lowercase values used in this
    file, in defaults, and in any future API responses.
    """
    return SAEnum(
        enum_cls,
        native_enum=True,
        validate_strings=True,
        values_callable=lambda cls: [member.value for member in cls],
        **kwargs,
    )


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"


class KnowledgeBaseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CallType(str, enum.Enum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class CallStatus(str, enum.Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    MISSED = "missed"
    CANCELLED = "cancelled"


class CallSentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    UNKNOWN = "unknown"


class CallMode(str, enum.Enum):
    """Module 9: was this call a local simulation, or a real Vapi/ElevenLabs call?"""

    DEMO = "demo"
    REAL = "real"


class FollowUpStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReportType(str, enum.Enum):
    CALL_SUMMARY = "call_summary"
    CUSTOMER_SUMMARY = "customer_summary"
    AGENT_PERFORMANCE = "agent_performance"
    CUSTOM = "custom"


class ProductAvailability(str, enum.Enum):
    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class KnowledgeBasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TelephonyProvider(str, enum.Enum):
    TWILIO = "twilio"
    EXOTEL = "exotel"
