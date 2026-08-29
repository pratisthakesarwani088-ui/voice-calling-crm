import { BarChart3, Phone, PhoneOff, Timer, Video, Voicemail } from "lucide-react";
import { useEffect, useState } from "react";

import Alert from "../components/Alert.jsx";
import RecentCallsList from "../components/calls/RecentCallsList.jsx";
import BarChart from "../components/charts/BarChart.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";
import Spinner from "../components/Spinner.jsx";
import StatCard from "../components/StatCard.jsx";
import { getCallsByPeriod, getRecentActivity, getReportSummary } from "../services/reportService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { formatDuration } from "../utils/callOptions.js";

/**
 * Reports page (Module 10). Every number here comes directly from a
 * database query (see backend/app/services/report_service.py) - no
 * placeholder or fabricated analytics. Reuses `StatCard` (Module 4)
 * and `RecentCallsList` (Module 9) directly rather than re-implementing
 * either.
 */
function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("day");
  const [periodPoints, setPeriodPoints] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setLoadError("");
    Promise.all([getReportSummary(), getCallsByPeriod({ period }), getRecentActivity({ limit: 5 })])
      .then(([summaryData, periodData, activityData]) => {
        setSummary(summaryData);
        setPeriodPoints(periodData.points);
        setRecentActivity(activityData.items);
      })
      .catch((error) => setLoadError(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [period]);

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Spinner className="h-5 w-5" />
        Loading reports...
      </div>
    );
  }

  if (loadError) {
    return <Alert variant="error" message={loadError} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          <BarChart3 size={22} className="text-blue-600" />
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Call analytics computed directly from your database — nothing simulated.
        </p>
      </div>

      {/* Stat cards — reusing Module 4's StatCard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Calls"
          value={summary.total_calls}
          icon={Phone}
          accentClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Demo Calls"
          value={summary.demo_calls}
          icon={Video}
          accentClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Real Calls"
          value={summary.real_calls}
          icon={Voicemail}
          accentClassName="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          label="Successful Calls"
          value={summary.successful_calls}
          icon={Phone}
          accentClassName="bg-green-50 text-green-600"
        />
        <StatCard
          label="Failed Calls"
          value={summary.failed_calls}
          icon={PhoneOff}
          accentClassName="bg-red-50 text-red-600"
        />
        <StatCard
          label="Avg Call Duration"
          value={formatDuration(summary.average_duration_seconds)}
          icon={Timer}
          accentClassName="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Calls by day/week/month — line chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Calls Over Time</h3>
          <div className="flex gap-1.5">
            {["day", "week", "month"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                  period === option
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <LineChart points={periodPoints} />
      </div>

      {/* Demo vs Real (pie) + Success vs Failed (bar) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Demo vs Real</h3>
          <PieChart
            segments={[
              { label: "Demo", value: summary.demo_calls, color: "#7c3aed" },
              { label: "Real", value: summary.real_calls, color: "#0891b2" },
            ]}
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Success vs Failed</h3>
          <BarChart
            bars={[
              { label: "Successful", value: summary.successful_calls, color: "#16a34a" },
              { label: "Failed", value: summary.failed_calls, color: "#dc2626" },
            ]}
          />
        </div>
      </div>

      {/* Recent Call Activity — reusing Module 9's RecentCallsList */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Call Activity</h3>
        <RecentCallsList calls={recentActivity} />
      </div>
    </div>
  );
}

export default ReportsPage;
