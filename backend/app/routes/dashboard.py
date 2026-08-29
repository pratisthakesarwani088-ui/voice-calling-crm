"""
Dashboard route.

JWT-protected via get_current_user, same as every other business
route. One endpoint returns everything the Dashboard page needs in a
single request; Recent Calls is intentionally not duplicated here - the
frontend calls the existing GET /calls (Module 10) directly for that.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.dashboard import (
    ActivityItem,
    CallStatusCounts,
    DashboardResponse,
    DashboardStats,
    SystemStatusItem,
)
from app.services.dashboard_service import (
    get_call_status_counts,
    get_dashboard_stats,
    get_recent_activity,
    get_system_status,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real Dashboard data - stats, system status, recent activity, and live call status counts, all read directly from the database."""
    return DashboardResponse(
        stats=DashboardStats(**get_dashboard_stats(db)),
        system_status=[SystemStatusItem(**item) for item in get_system_status(db)],
        recent_activity=[ActivityItem(**item) for item in get_recent_activity(db)],
        call_status_counts=CallStatusCounts(**get_call_status_counts(db)),
    )
