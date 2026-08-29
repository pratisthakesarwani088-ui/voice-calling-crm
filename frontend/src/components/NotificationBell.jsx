import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { timeAgo } from "./RecentActivityList.jsx";
import { getDashboard } from "../services/dashboardService.js";

const POLL_INTERVAL_MS = 30000;
const LAST_SEEN_STORAGE_KEY = "ai_voice_crm_notifications_last_seen";

/**
 * Real notifications, not a static dot: reuses the exact same
 * recent-activity data the Dashboard page shows (Customer Added /
 * Product Added / Call Completed / Knowledge Updated) - no new
 * backend endpoint, one extra call to the existing GET /dashboard.
 * "Unread" = activity newer than the last time the dropdown was
 * opened, persisted in localStorage so it survives a page reload.
 */
function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const [lastSeen, setLastSeen] = useState(() => {
    const stored = localStorage.getItem(LAST_SEEN_STORAGE_KEY);
    return stored ? new Date(stored) : new Date(0);
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    function fetchActivity() {
      getDashboard()
        .then((data) => {
          if (isMounted) setActivity(data.recent_activity);
        })
        .catch(() => {
          if (isMounted) setActivity([]);
        });
    }

    fetchActivity();
    const intervalId = setInterval(fetchActivity, POLL_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const unreadCount = activity.filter((item) => new Date(item.timestamp) > lastSeen).length;

  function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && activity.length > 0) {
      // Mark as read only up to the newest item actually shown in this
      // fetch — not the current wall-clock time. Using "now" here would
      // silently mark unfetched-but-already-created activity as read
      // too (it would arrive on the next poll with an earlier real
      // timestamp than "now" and be filtered out), so the badge could
      // under-count something the admin never actually saw.
      const latestTimestamp = activity.reduce(
        (latest, item) => {
          const itemDate = new Date(item.timestamp);
          return itemDate > latest ? itemDate : latest;
        },
        new Date(0),
      );
      setLastSeen(latestTimestamp);
      localStorage.setItem(LAST_SEEN_STORAGE_KEY, latestTimestamp.toISOString());
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
          <p className="border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-900">
            Notifications
          </p>
          {activity.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {activity.map((item, index) => (
                <li key={`${item.type}-${index}`} className="px-4 py-2.5 hover:bg-gray-50">
                  <p className="text-sm text-gray-800">
                    {item.title}
                    {item.description ? `: ${item.description}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{timeAgo(item.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
