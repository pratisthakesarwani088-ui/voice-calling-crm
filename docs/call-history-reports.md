# Call History & Reports - Module 10

## Overview

Two features built entirely on top of Module 9's existing `calls`
table - no new tables, no fake/placeholder analytics. Every number on
the Reports page comes from a real COUNT/AVG/GROUP BY query.

- **Call History** - search/filter/paginate every saved call, view full
  details (transcript, recording), soft-delete.
- **Reports** - dashboard statistics, calls-over-time line chart,
  Demo-vs-Real pie chart, Success-vs-Failed bar chart, recent activity.

## Database changes

`calls` table gains soft-delete (Module 2/9 deliberately left this out
- "calls are an audit/compliance trail... not expected to be deleted
through normal app usage" - but Module 10 explicitly requires a Delete
Call action, so it's added now):
- `is_deleted` (boolean, NOT NULL, default false)
- `deleted_at` (nullable datetime)

Migration: `backend/alembic/versions/20260820_0900_dfaded6abb5f_add_call_soft_delete.py`

A soft-deleted call's row - including its transcript and recording URL
- is never removed; it's just excluded from Call History, `GET /calls/
{id}`, and Reports from that point on.

## Backend design notes

**One list function, two call sites.** `call_service.list_calls()`
replaced Module 9's narrower `list_recent_calls()` - it now supports
search (customer name/phone, via a join), mode filter, status filter,
date range, sort, and pagination. Both the Voice Calling page's small
"recent calls" widget (Module 9, page_size=`limit`, no filters) and the
full Call History page (Module 10, every filter) call this same
function - no duplicated query logic between them. The `GET /calls`
route stayed fully backward compatible: it still accepts a bare
`?customer_id=&limit=` call exactly as Module 9's frontend already
sends, defaulting to page 1 with no filters when the newer params
aren't supplied.

**Reports reuse Call History's list function too.** "Recent Call
Activity" calls `list_calls(page_size=N, sort="newest")` - the exact
same function and the exact same `call_to_out` response mapper
(exported from `app/routes/calls.py`, made public specifically for
this reuse) that Call History uses. There is no second "fetch recent
calls" implementation anywhere in this module.

**Success vs Failed definition.** A call counts as "successful" once
`status == COMPLETED`; "failed" covers `FAILED`, `MISSED`, and
`CANCELLED`. Still-active calls (`QUEUED`/`IN_PROGRESS`) are excluded
from this specific breakdown (they haven't succeeded or failed yet) but
are still counted in `total_calls`. Documented explicitly in
`report_service.py` since this is a judgment call the spec didn't spell
out.

**MySQL-specific date grouping.** `calls-by-period` uses `DATE()` (day),
`DATE_FORMAT(..., "%x-W%v")` (ISO week), and `DATE_FORMAT(..., "%Y-%m")`
(month) directly - this project targets MySQL only (see
`docs/database.md`), so there's no cross-database portability concern.

## API

All JWT-protected.

### Call History (`/calls`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/calls` | List - search/mode/status/date-range/sort/page/page_size (also serves Module 9's simple `?customer_id=&limit=` shape unchanged) |
| GET | `/calls/{id}` | Get call details (unchanged from Module 9) |
| DELETE | `/calls/{id}` | Soft-delete a call |

### Reports (`/reports`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/reports/summary` | Total/Demo/Real/Successful/Failed calls + average duration |
| GET | `/reports/calls-by-period?period=day\|week\|month&buckets=N` | Time-series for the line chart |
| GET | `/reports/recent-activity?limit=N` | Most recent calls |

## Frontend

- `pages/CallHistoryPage.jsx` - mirrors `CustomersPage.jsx`'s structure exactly
- `components/calls/CallHistoryFilters.jsx`, `CallHistoryTable.jsx`, `CallDetailsModal.jsx`
- `components/charts/LineChart.jsx`, `PieChart.jsx`, `BarChart.jsx` - small, dependency-free SVG components (no charting library was already in this project, and adding one couldn't be verified to install correctly in this sandbox - see Self Review)
- `pages/ReportsPage.jsx` - reuses `StatCard` (Module 4) and `RecentCallsList` (Module 9) directly, unmodified

**Entry points, no new Sidebar item:**
- The Sidebar's pre-existing **"Reports"** entry (built in Module 4,
  always pointing at `/reports`) now renders `ReportsPage` instead of
  `ComingSoonPage` - the same pattern Modules 5/6/9 used.
- Call History is reachable via a small **"View All"** link added next
  to "Recent Calls" on the Voice Calling page (Module 9) - one link,
  not a redesign of that page.

## Manual testing steps

**Backend**:
```bash
BASE=http://localhost:8000/api/v1
TOKEN="<paste a token>"

# Full search/filter/paginated list
curl "$BASE/calls?search=Aarav&mode=demo&status=completed&page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN"

# Module 9's original simple shape still works unchanged
curl "$BASE/calls?customer_id=1&limit=5" -H "Authorization: Bearer $TOKEN"

# Soft delete
curl -X DELETE "$BASE/calls/<id>" -H "Authorization: Bearer $TOKEN"
# then confirm it's gone from the list:
curl "$BASE/calls" -H "Authorization: Bearer $TOKEN"

# Reports
curl "$BASE/reports/summary" -H "Authorization: Bearer $TOKEN"
curl "$BASE/reports/calls-by-period?period=week&buckets=8" -H "Authorization: Bearer $TOKEN"
curl "$BASE/reports/recent-activity?limit=5" -H "Authorization: Bearer $TOKEN"

# No token - expect 401
curl "$BASE/calls"
curl "$BASE/reports/summary"
```

**Frontend**
1. Sidebar - **Reports** - see 6 stat cards, all three charts, and Recent Call Activity - all populated from real placed calls (make a few Demo calls first via the Voice Calling page if the database is empty).
2. Toggle the Calls Over Time chart between Day/Week/Month.
3. Voice Calling page - "View All" next to Recent Calls - lands on Call History.
4. Search by customer name/phone, filter by mode/status/date range, confirm results narrow correctly; pagination appears past 10 results.
5. Click **View** on a call - modal shows full details + transcript; if `recording_url` is set, an audio player appears - otherwise "No Recording Available".
6. Click **Delete** - confirmation dialog - confirm - "Call Deleted" toast, row disappears from the list.
7. Confirm Customers/Products/Knowledge Base/Import/AI Assistant/Voice Calling pages still work exactly as before.
8. Resize through mobile/tablet/laptop/desktop - charts, filters, and the table all reflow correctly (the table scrolls horizontally on narrow screens, matching every other data table in this project).
