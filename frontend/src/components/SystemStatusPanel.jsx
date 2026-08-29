import Badge from "./Badge.jsx";

// Reaching this component at all means the authenticated API request
// that loaded it already succeeded — which is only possible if the
// backend is running and JWT auth verified. These two rows are true
// by construction, not hardcoded guesses; `items` (Database/Gemini/
// Vapi/ElevenLabs) is real data fetched by pages/DashboardPage.jsx.
const STATIC_ROWS = [
  { key: "backend", label: "Backend", status: "Connected", variant: "success" },
  { key: "auth", label: "Authentication", status: "Active", variant: "success" },
];

/**
 * Lists each integration/service and its current status. Database/
 * Gemini/Vapi/ElevenLabs come from the real backend check (see
 * services/dashboardService.js) — updating what they show is a data
 * change, not a UI change. Row order matches the original layout
 * exactly: Backend, Database, Authentication, Gemini, Vapi, ElevenLabs.
 */
function SystemStatusPanel({ items = [] }) {
  const byKey = Object.fromEntries(items.map((item) => [item.key, item]));
  const toRow = (item) =>
    item && {
      key: item.key,
      label: item.label,
      status: item.status,
      variant: item.connected ? "success" : "neutral",
    };

  const rows = [
    STATIC_ROWS[0],
    toRow(byKey.database),
    STATIC_ROWS[1],
    toRow(byKey.gemini),
    toRow(byKey.vapi),
    toRow(byKey.elevenlabs),
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">System Status</h3>
      <ul className="mt-4 space-y-3">
        {rows.map(({ key, label, status, variant }) => (
          <li key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{label}</span>
            <Badge label={status} variant={variant} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SystemStatusPanel;
