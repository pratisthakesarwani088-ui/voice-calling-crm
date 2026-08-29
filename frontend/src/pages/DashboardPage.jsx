import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Boxes,
  CheckCircle2,
  Clock,
  Phone,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import CallStatusPanel from "../components/CallStatusPanel.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import QuickActions from "../components/QuickActions.jsx";
import RecentActivityList from "../components/RecentActivityList.jsx";
import RecentCallsTable from "../components/RecentCallsTable.jsx";
import StatCard from "../components/StatCard.jsx";
import SystemStatusPanel from "../components/SystemStatusPanel.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { getDashboard } from "../services/dashboardService.js";
import { deleteCall, listCalls } from "../services/callService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { formatDuration } from "../utils/callOptions.js";
import { ROUTES } from "../utils/constants.js";

const AUTO_REFRESH_INTERVAL_MS = 30000;
const RECENT_CALLS_LIMIT = 5;

const STAT_ICONS = {
  total_customers: { label: "Total Customers", icon: Users, accent: "bg-blue-50 text-blue-600" },
  total_products: { label: "Products", icon: Boxes, accent: "bg-purple-50 text-purple-600" },
  total_knowledge_base: { label: "Knowledge Base", icon: BookOpen, accent: "bg-amber-50 text-amber-600" },
  total_calls: { label: "Total Calls", icon: Phone, accent: "bg-cyan-50 text-cyan-600" },
  completed_calls: { label: "Completed Calls", icon: CheckCircle2, accent: "bg-green-50 text-green-600" },
  pending_follow_ups: { label: "Pending Follow Ups", icon: Clock, accent: "bg-red-50 text-red-600" },
};

const EMPTY_STATS = {
  total_customers: 0,
  total_products: 0,
  total_knowledge_base: 0,
  total_calls: 0,
  completed_calls: 0,
  pending_follow_ups: 0,
};

function mapCallToRow(call) {
  return {
    id: call.id,
    customer: call.customer_name,
    phone: call.customer_phone,
    mode: call.mode,
    status: call.status,
    duration: formatDuration(call.duration),
    date: new Date(call.started_at).toLocaleDateString(),
  };
}

/**
 * Dashboard — same cards/grid/layout as Module 4, now backed by real
 * data. Stats/system status/recent activity come from one call to
 * services/dashboardService.js; Recent Calls reuses the existing
 * services/callService.js (Module 10) rather than a duplicate query.
 * Refreshes on mount, every 30s while open, and immediately after a
 * Quick Actions import or a Recent Calls deletion.
 */
function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(EMPTY_STATS);
  const [systemStatus, setSystemStatus] = useState([]);
  const [callStatusCounts, setCallStatusCounts] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);

  const [deletingCall, setDeletingCall] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [dashboard, callsResult] = await Promise.all([
        getDashboard(),
        listCalls({ sort: "newest", page: 1, page_size: RECENT_CALLS_LIMIT }),
      ]);
      setStats(dashboard.stats);
      setSystemStatus(dashboard.system_status);
      setCallStatusCounts(dashboard.call_status_counts);
      setRecentActivity(dashboard.recent_activity);
      setRecentCalls(callsResult.items.map(mapCallToRow));
    } catch {
      // A failed background refresh shouldn't clear already-visible
      // data — the existing values simply stay on screen until the
      // next successful refresh.
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  function handleViewCall() {
    navigate(ROUTES.CALL_HISTORY);
  }

  async function handleConfirmDeleteCall() {
    if (!deletingCall) return;
    setIsDeleting(true);
    try {
      await deleteCall(deletingCall.id);
      showToast("Call Deleted", "success");
      setDeletingCall(null);
      refresh();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with TechNova Electronics today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(STAT_ICONS).map(([key, { label, icon, accent }]) => (
          <StatCard
            key={key}
            label={label}
            value={stats[key]}
            icon={icon}
            accentClassName={accent}
          />
        ))}
      </div>

      {/* System status + Call status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SystemStatusPanel items={systemStatus} />
        <CallStatusPanel counts={callStatusCounts} />
      </div>

      {/* Recent calls */}
      <RecentCallsTable rows={recentCalls} onView={handleViewCall} onDelete={setDeletingCall} />

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivityList items={recentActivity} />
        <QuickActions onImported={refresh} />
      </div>

      <ConfirmDialog
        isOpen={Boolean(deletingCall)}
        title="Delete Call"
        message={
          deletingCall &&
          `Are you sure you want to delete this call with "${deletingCall.customer}"? Its record is kept for history but will no longer appear in lists.`
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDeleteCall}
        onCancel={() => setDeletingCall(null)}
      />
    </div>
  );
}

export default DashboardPage;
