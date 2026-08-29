"""
Dashboard service.

Read-only: every function here only SELECTs from tables Modules 2-11
already defined (Customer, Product, KnowledgeBase, Call, FollowUp) and
reads existing env-var settings - it never writes, and never touches
any other module's service/route file. This is what "make the
Dashboard functional without modifying other modules" means in
practice: the Dashboard gets its own thin read layer instead of
reaching into (or duplicating) other modules' business logic.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.call import Call
from app.models.customer import Customer
from app.models.enums import CallStatus, FollowUpStatus
from app.models.follow_up import FollowUp
from app.models.knowledge_base import KnowledgeBase
from app.models.product import Product

ACTIVITY_LIMIT_PER_SOURCE = 5
ACTIVITY_TOTAL_LIMIT = 5


def get_dashboard_stats(db: Session) -> dict:
    """Real counts for the six Dashboard stat cards - each a simple COUNT query."""

    def _count(model, *filters) -> int:
        return db.execute(select(func.count()).select_from(model).where(*filters)).scalar_one()

    return {
        "total_customers": _count(Customer, Customer.is_deleted.is_(False)),
        "total_products": _count(Product, Product.is_deleted.is_(False)),
        "total_knowledge_base": _count(KnowledgeBase, KnowledgeBase.is_deleted.is_(False)),
        "total_calls": _count(Call, Call.is_deleted.is_(False)),
        "completed_calls": _count(
            Call, Call.is_deleted.is_(False), Call.status == CallStatus.COMPLETED
        ),
        "pending_follow_ups": _count(FollowUp, FollowUp.status == FollowUpStatus.PENDING),
    }


def get_call_status_counts(db: Session) -> dict:
    """
    Live count of non-deleted calls in each real, persisted CallStatus —
    one GROUP BY query, not six separate COUNTs. Powers the Dashboard's
    Call Status panel; the frontend maps these six real statuses onto
    the panel's nine displayed labels (some labels share one underlying
    count, since the schema doesn't distinguish e.g. "Dialing" from
    "Ringing" — both are just CallStatus.QUEUED — see
    components/CallStatusPanel.jsx for the exact mapping).
    """
    rows = db.execute(
        select(Call.status, func.count())
        .where(Call.is_deleted.is_(False))
        .group_by(Call.status)
    ).all()
    counts_by_status = {status.value: count for status, count in rows}

    return {
        "queued": counts_by_status.get(CallStatus.QUEUED.value, 0),
        "in_progress": counts_by_status.get(CallStatus.IN_PROGRESS.value, 0),
        "completed": counts_by_status.get(CallStatus.COMPLETED.value, 0),
        "failed": counts_by_status.get(CallStatus.FAILED.value, 0),
        "missed": counts_by_status.get(CallStatus.MISSED.value, 0),
        "cancelled": counts_by_status.get(CallStatus.CANCELLED.value, 0),
    }


def _db_is_reachable(db: Session) -> bool:
    """
    If this function is even running, the request already passed the
    JWT auth dependency, which itself requires a successful database
    query to look up the user - so reaching here already proves the
    database is reachable. This check is kept explicit anyway (rather
    than just returning True unconditionally) so a mid-request DB
    failure is reported honestly instead of assumed.
    """
    try:
        db.execute(select(1))
        return True
    except Exception:
        return False


def get_system_status(db: Session) -> list[dict]:
    """
    Real status for each integration. Database/Gemini/Vapi/ElevenLabs
    reflect actual connectivity/configuration - not hardcoded labels.
    Backend and Authentication are omitted here since reaching this
    JWT-protected endpoint at all already proves both are working;
    the previous static "Connected"/"Active" rows for those two are
    left as-is on the frontend (see components/SystemStatusPanel.jsx).
    """
    database_connected = _db_is_reachable(db)

    return [
        {
            "key": "database",
            "label": "Database",
            "connected": database_connected,
            "status": "Connected" if database_connected else "Disconnected",
        },
        {
            "key": "gemini",
            "label": "Gemini",
            "connected": settings.is_gemini_configured,
            "status": "Connected" if settings.is_gemini_configured else "Not Configured",
        },
        {
            "key": "vapi",
            "label": "Vapi",
            "connected": bool(settings.VAPI_API_KEY.strip()),
            "status": "Connected" if settings.VAPI_API_KEY.strip() else "Not Configured",
        },
        {
            "key": "elevenlabs",
            "label": "ElevenLabs",
            "connected": bool(settings.ELEVENLABS_API_KEY.strip()),
            "status": "Connected" if settings.ELEVENLABS_API_KEY.strip() else "Not Configured",
        },
    ]


def get_recent_activity(db: Session) -> list[dict]:
    """
    Merges the most recent Customer/Product/completed-Call/KnowledgeBase
    events into one timeline, newest first. Each source is queried
    independently (existing tables, no new ones) and combined in memory
    - there is no unified activity-log table in this project, and
    building one would be a far larger change than "make the Dashboard
    functional" calls for.
    """
    events: list[dict] = []

    recent_customers = db.execute(
        select(Customer.full_name, Customer.created_at)
        .where(Customer.is_deleted.is_(False))
        .order_by(Customer.created_at.desc())
        .limit(ACTIVITY_LIMIT_PER_SOURCE)
    ).all()
    for name, created_at in recent_customers:
        events.append(
            {
                "type": "customer_added",
                "title": "Customer Added",
                "description": name,
                "timestamp": created_at,
            }
        )

    recent_products = db.execute(
        select(Product.product_name, Product.created_at)
        .where(Product.is_deleted.is_(False))
        .order_by(Product.created_at.desc())
        .limit(ACTIVITY_LIMIT_PER_SOURCE)
    ).all()
    for name, created_at in recent_products:
        events.append(
            {
                "type": "product_added",
                "title": "Product Added",
                "description": name,
                "timestamp": created_at,
            }
        )

    recent_calls = db.execute(
        select(Customer.full_name, Call.ended_at)
        .join(Customer, Call.customer_id == Customer.id)
        .where(
            Call.is_deleted.is_(False),
            Call.status == CallStatus.COMPLETED,
            Call.ended_at.isnot(None),
        )
        .order_by(Call.ended_at.desc())
        .limit(ACTIVITY_LIMIT_PER_SOURCE)
    ).all()
    for customer_name, ended_at in recent_calls:
        events.append(
            {
                "type": "call_completed",
                "title": "Call Completed",
                "description": customer_name,
                "timestamp": ended_at,
            }
        )

    recent_knowledge = db.execute(
        select(KnowledgeBase.title, KnowledgeBase.updated_at)
        .where(KnowledgeBase.is_deleted.is_(False))
        .order_by(KnowledgeBase.updated_at.desc())
        .limit(ACTIVITY_LIMIT_PER_SOURCE)
    ).all()
    for title, updated_at in recent_knowledge:
        events.append(
            {
                "type": "knowledge_updated",
                "title": "Knowledge Updated",
                "description": title,
                "timestamp": updated_at,
            }
        )

    def _sort_key(event: dict) -> datetime:
        timestamp = event["timestamp"]
        return timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=None)

    events.sort(key=_sort_key, reverse=True)
    return events[:ACTIVITY_TOTAL_LIMIT]
