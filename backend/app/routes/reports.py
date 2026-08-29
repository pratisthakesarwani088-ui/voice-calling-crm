"""
Reports routes.

JWT-protected via get_current_user. Thin: calls the report/call
services and returns their results - no aggregation logic lives here.
"Recent Call Activity" reuses app.services.call_service.list_calls and
app.routes.calls.call_to_out directly - the exact same function/mapper
Call History uses - so there is no duplicated "fetch recent calls"
logic anywhere in this module.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routes.calls import call_to_out
from app.schemas.call import CallListResponse
from app.schemas.report import CallsByPeriodPoint, CallsByPeriodResponse, ReportSummary
from app.services.call_service import list_calls, total_pages_for
from app.services.report_service import CallsByPeriod, get_call_report_summary, get_calls_by_period

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=ReportSummary)
def get_report_summary_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dashboard statistics: Total/Demo/Real/Successful/Failed calls and
    average call duration - every number computed directly from the
    `calls` table, never fabricated.
    """
    return ReportSummary(**get_call_report_summary(db))


@router.get("/calls-by-period", response_model=CallsByPeriodResponse)
def get_calls_by_period_route(
    period: CallsByPeriod = Query(default="day"),
    buckets: int = Query(default=14, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Call counts grouped by day/week/month - powers the Calls by Day line chart."""
    points = get_calls_by_period(db, period=period, buckets=buckets)
    return CallsByPeriodResponse(
        period=period,
        points=[CallsByPeriodPoint(**point) for point in points],
    )


@router.get("/recent-activity", response_model=CallListResponse)
def get_recent_activity_route(
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    The most recent calls, for the Reports page's "Recent Call
    Activity" section - reuses app.services.call_service.list_calls
    (the same function Call History uses) rather than a separate query.
    """
    calls, total = list_calls(db, page=1, page_size=limit, sort="newest")
    return CallListResponse(
        items=[call_to_out(call) for call in calls],
        total=total,
        page=1,
        page_size=limit,
        total_pages=total_pages_for(total, limit),
    )
