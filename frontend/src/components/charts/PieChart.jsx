/**
 * Minimal, dependency-free SVG donut chart. Generic - takes `segments`
 * as `{label, value, color}`, so it's reusable for any 2+ category
 * breakdown, not just Demo-vs-Real.
 */
function PieChart({ segments, size = 160 }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-gray-400">
        No data yet.
      </div>
    );
  }

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 160 160" width={size} height={size}>
        <g transform="rotate(-90 80 80)">
          {segments.map((segment) => {
            const fraction = segment.value / total;
            const dash = fraction * circumference;
            const offset = cumulativeOffset;
            cumulativeOffset += dash;
            return (
              <circle
                key={segment.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="24"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="20" fontWeight="600" fill="#1f2937">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" fontSize="10" fill="#9ca3af">
          total
        </text>
      </svg>

      <div className="space-y-1.5">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-gray-600">{segment.label}</span>
            <span className="font-medium text-gray-900">{segment.value}</span>
            <span className="text-xs text-gray-400">
              ({total > 0 ? Math.round((segment.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PieChart;
