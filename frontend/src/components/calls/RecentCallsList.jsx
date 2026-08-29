import { PhoneOff } from "lucide-react";

import Badge from "../Badge.jsx";
import { CALL_STATUS_VARIANT, formatDuration } from "../../utils/callOptions.js";

/**
 * A lightweight recent-calls list for the Voice Calling page - not a
 * full paginated Calls management module (out of this module's
 * scope), just enough history to see what was just called.
 */
function RecentCallsList({ calls }) {
  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <PhoneOff size={18} />
        </span>
        <p className="text-sm text-gray-400">No calls yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {calls.map((call) => (
        <li key={call.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{call.customer_name}</p>
            <p className="truncate text-xs text-gray-500">
              {call.product_name || "—"} · {new Date(call.started_at).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-400">{formatDuration(call.duration)}</span>
            <Badge
              label={call.status.replace("_", " ")}
              variant={CALL_STATUS_VARIANT[call.status] || "neutral"}
              className="capitalize"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default RecentCallsList;
