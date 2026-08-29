"""
Dashboard schemas.

One response shape covering everything the Dashboard page needs
(stats, system status, recent activity) in a single request - Recent
Calls is deliberately NOT included here since GET /calls (Module 10)
already serves that with sort/pagination; the Dashboard just calls it
directly rather than duplicating that query.
"""

from datetime import datetime

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_customers: int
    total_products: int
    total_knowledge_base: int
    total_calls: int
    completed_calls: int
    pending_follow_ups: int


class SystemStatusItem(BaseModel):
    key: str
    label: str
    connected: bool
    status: str  # display label, e.g. "Connected" / "Not Configured"


class ActivityItem(BaseModel):
    type: str  # "customer_added" | "product_added" | "call_completed" | "knowledge_updated"
    title: str
    description: str
    timestamp: datetime


class CallStatusCounts(BaseModel):
    """
    Live counts of calls currently in each real, persisted CallStatus
    (see backend/app/models/enums.py:CallStatus) — computed fresh on
    every request, not cached or fabricated.
    """

    queued: int
    in_progress: int
    completed: int
    failed: int
    missed: int
    cancelled: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    system_status: list[SystemStatusItem]
    recent_activity: list[ActivityItem]
    call_status_counts: CallStatusCounts
