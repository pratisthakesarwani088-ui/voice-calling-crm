"""
Report response schemas.

`ReportSummary` covers the stat cards, the Demo-vs-Real pie chart, and
the Success-vs-Failed bar chart in one response - the frontend derives
all three views from these same numbers rather than fetching separate
shapes for each, so there's exactly one source of truth for what
"total calls" means everywhere on the Reports page.
"""

from pydantic import BaseModel


class ReportSummary(BaseModel):
    """Response for GET /reports/summary."""

    total_calls: int
    demo_calls: int
    real_calls: int
    successful_calls: int
    failed_calls: int
    average_duration_seconds: float


class CallsByPeriodPoint(BaseModel):
    """One point on the "Calls by Day/Week/Month" line chart."""

    label: str
    count: int


class CallsByPeriodResponse(BaseModel):
    """Response for GET /reports/calls-by-period."""

    period: str
    points: list[CallsByPeriodPoint]
