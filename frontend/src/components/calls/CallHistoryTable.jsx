import { PhoneOff } from "lucide-react";

import ActionButtons from "../ActionButtons.jsx";
import Badge from "../Badge.jsx";
import { CALL_STATUS_VARIANT, formatDuration } from "../../utils/callOptions.js";

/**
 * Call History table. Only View/Delete are in scope (no Call/Edit) -
 * a saved call record isn't editable, and re-calling from history
 * isn't part of this module - achieved via ActionButtons'
 * `visibleActions` prop without modifying that shared component's
 * default behavior for Customers/Products/Dashboard.
 */
function CallHistoryTable({ calls, onView, onDelete, isLoading }) {
  if (!isLoading && calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <PhoneOff size={22} />
        </span>
        <p className="text-sm font-medium text-gray-500">No calls found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Mode</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Duration</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {calls.map((call) => (
            <tr key={call.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                {call.customer_name}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {call.customer_phone}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {call.product_name || "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 capitalize text-gray-600">
                {call.mode}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <Badge
                  label={call.status.replace("_", " ")}
                  variant={CALL_STATUS_VARIANT[call.status] || "neutral"}
                  className="capitalize"
                />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {formatDuration(call.duration)}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {new Date(call.started_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <ActionButtons
                  visibleActions={["view", "delete"]}
                  onView={() => onView(call)}
                  onDelete={() => onDelete(call)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CallHistoryTable;
