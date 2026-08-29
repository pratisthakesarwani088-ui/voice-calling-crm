"""
Report service.

Pure aggregate SQL over the existing `calls` table - no new tables, no
fake/placeholder data. Every number here comes directly from a COUNT/
AVG/GROUP BY query against real rows. "Recent Call Activity" isn't
duplicated here - the route reuses app.services.call_service.list_calls
directly (see app/routes/reports.py), the same function Call History
uses, just with a small page size.
"""

from datetime import timedelta
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.base import utcnow
from app.models.call import Call
from app.models.enums import CallMode, CallStatus

# A call counts as "successful" only once it has actually completed;
# anything else that reached a terminal (non-active) state counts as
# "failed" for this report. Still-active calls (queued/in_progress)
# are excluded from this specific breakdown - they haven't succeeded
# or failed yet - but are still counted in `total_calls`.
_FAILED_STATUSES = (CallStatus.FAILED, CallStatus.MISSED, CallStatus.CANCELLED)

CallsByPeriod = Literal["day", "week", "month"]


def get_call_report_summary(db: Session) -> dict:
    """Dashboard statistics: totals, mode split, success/fail split, average duration."""
    base_filter = Call.is_deleted.is_(False)

    def _count(*extra_filters) -> int:
        return db.execute(
            select(func.count()).select_from(Call).where(base_filter, *extra_filters)
        ).scalar_one()

    total_calls = _count()
    demo_calls = _count(Call.mode == CallMode.DEMO)
    real_calls = _count(Call.mode == CallMode.REAL)
    successful_calls = _count(Call.status == CallStatus.COMPLETED)
    failed_calls = _count(Call.status.in_(_FAILED_STATUSES))

    average_duration = db.execute(
        select(func.avg(Call.duration)).where(base_filter, Call.duration.isnot(None))
    ).scalar_one()

    return {
        "total_calls": total_calls,
        "demo_calls": demo_calls,
        "real_calls": real_calls,
        "successful_calls": successful_calls,
        "failed_calls": failed_calls,
        "average_duration_seconds": round(float(average_duration), 1) if average_duration else 0.0,
    }


def get_calls_by_period(
    db: Session, *, period: CallsByPeriod = "day", buckets: int = 14
) -> list[dict]:
    """
    Call counts grouped by day, week, or month, for the last `buckets`
    periods - powers the "Calls by Day" line chart. Uses MySQL's
    DATE()/DATE_FORMAT() directly (this project targets MySQL only -
    see docs/database.md - so there's no need for cross-database
    portability here).
    """
    if period == "day":
        bucket_expr = func.date(Call.started_at)
        since = utcnow() - timedelta(days=buckets)
    elif period == "week":
        # MySQL's %x-W%v gives an ISO year-week label like "2026-W34".
        bucket_expr = func.date_format(Call.started_at, "%x-W%v")
        since = utcnow() - timedelta(weeks=buckets)
    else:
        bucket_expr = func.date_format(Call.started_at, "%Y-%m")
        since = utcnow() - timedelta(days=31 * buckets)

    rows = db.execute(
        select(bucket_expr.label("bucket"), func.count().label("count"))
        .where(Call.is_deleted.is_(False), Call.started_at >= since)
        .group_by("bucket")
        .order_by("bucket")
    ).all()

    return [{"label": str(row.bucket), "count": row.count} for row in rows]
