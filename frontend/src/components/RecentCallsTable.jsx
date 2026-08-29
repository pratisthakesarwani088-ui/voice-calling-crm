import ActionButtons from "./ActionButtons.jsx";
import Badge from "./Badge.jsx";
import { CALL_STATUS_VARIANT } from "../utils/callOptions.js";

/**
 * Recent Calls table.
 *
 * `rows` is real Call data (see pages/DashboardPage.jsx, which fetches
 * it via services/callService.js's existing listCalls — no duplicated
 * query logic). Status uses the same lowercase-keyed variant map and
 * label/variant split as components/calls/CallHistoryTable.jsx, so a
 * status like "in_progress" renders as "In Progress" with the correct
 * color. View/Delete reuse the exact same visibleActions=["view",
 * "delete"] pattern CallHistoryTable already uses — Edit/Call were
 * never real concepts for a saved call record here.
 */
function RecentCallsTable({ rows, onView, onDelete }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Calls</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Mode</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Duration</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                  No calls yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                    {row.customer}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{row.phone}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 capitalize text-gray-600">
                    {row.mode}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Badge
                      label={row.status.replace("_", " ")}
                      variant={CALL_STATUS_VARIANT[row.status] || "neutral"}
                      className="capitalize"
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{row.duration}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{row.date}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <ActionButtons
                      visibleActions={["view", "delete"]}
                      onView={() => onView?.(row)}
                      onDelete={() => onDelete?.(row)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentCallsTable;
