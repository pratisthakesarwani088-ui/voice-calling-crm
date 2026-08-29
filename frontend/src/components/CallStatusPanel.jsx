import Badge from "./Badge.jsx";
import { CALL_STATUSES } from "../utils/dashboardData.js";

/**
 * Displays every call status as a badge with its live count, read
 * directly from the database (see services/dashboardService.js's
 * call_status_counts, computed in backend/app/services/dashboard_service.py).
 * Replaces what was a static, count-less legend.
 *
 * The backend only persists 6 real statuses (queued/in_progress/
 * completed/failed/missed/cancelled), not these 9 labels, so a few
 * labels intentionally share one live count via `countKey` (e.g.
 * Dialing and Ringing both show the "queued" count) — see
 * utils/dashboardData.js's CALL_STATUSES for the exact mapping. This
 * keeps every number real rather than inventing a split the schema
 * doesn't support.
 */
function CallStatusPanel({ counts }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Call Status</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {CALL_STATUSES.map(({ key, label, variant, countKey }) => (
          <Badge key={key} label={`${label} (${counts?.[countKey] ?? 0})`} variant={variant} />
        ))}
      </div>
    </div>
  );
}

export default CallStatusPanel;
