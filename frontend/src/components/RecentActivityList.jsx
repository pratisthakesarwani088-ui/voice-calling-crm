import { BookOpenCheck, PhoneCall, Boxes, UserPlus } from "lucide-react";

const ACTIVITY_ICON = {
  customer_added: { Icon: UserPlus, accent: "bg-blue-50 text-blue-600" },
  product_added: { Icon: Boxes, accent: "bg-purple-50 text-purple-600" },
  call_completed: { Icon: PhoneCall, accent: "bg-green-50 text-green-600" },
  knowledge_updated: { Icon: BookOpenCheck, accent: "bg-amber-50 text-amber-600" },
};

/**
 * Formats an ISO timestamp as a short relative string ("2 hours ago"),
 * matching the original placeholder's style — no new dependency, a
 * small local helper is enough for this. Exported so NotificationBell
 * can reuse the exact same formatting instead of duplicating it.
 */
export function timeAgo(isoTimestamp) {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/**
 * Real activity timeline — `items` is fetched by pages/DashboardPage.jsx
 * from services/dashboardService.js, merging recent Customer/Product/
 * completed-Call/KnowledgeBase events (see backend/app/services/dashboard_service.py).
 */
function RecentActivityList({ items = [] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No recent activity yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item, index) => {
            const { Icon, accent } = ACTIVITY_ICON[item.type] || {};
            return (
              <li key={`${item.type}-${index}`} className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accent}`}>
                  {Icon && <Icon size={15} />}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.title}
                    {item.description ? `: ${item.description}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{timeAgo(item.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RecentActivityList;
