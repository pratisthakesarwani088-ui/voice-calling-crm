/**
 * Minimal, dependency-free SVG line chart. Generic - takes `points`
 * as `{label, count}` and scales automatically, so it's reusable for
 * any time-series data, not just calls.
 *
 * Built without a charting library on purpose: this project has no
 * existing chart dependency, and a small, fully-readable SVG component
 * is easier to verify correct than an unfamiliar third-party API.
 */
function LineChart({ points, height = 220, color = "#2563eb" }) {
  if (!points || points.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
        No data for this period.
      </div>
    );
  }

  const width = 600;
  const paddingX = 32;
  const paddingY = 24;
  const maxCount = Math.max(...points.map((p) => p.count), 1);

  const stepX = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;
  const scaleY = (value) => height - paddingY - (value / maxCount) * (height - paddingY * 2);

  const coords = points.map((point, index) => ({
    x: paddingX + index * stepX,
    y: scaleY(point.count),
    ...point,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const lastCoord = coords[coords.length - 1];
  const areaPath = `${linePath} L${lastCoord.x},${height - paddingY} L${coords[0].x},${height - paddingY} Z`;

  // Show at most ~7 x-axis labels so they don't overlap on narrow screens.
  const labelStride = Math.max(1, Math.ceil(coords.length / 7));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <line
        x1={paddingX}
        y1={height - paddingY}
        x2={width - paddingX}
        y2={height - paddingY}
        stroke="#e5e7eb"
      />
      <path d={areaPath} fill={color} fillOpacity="0.08" stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r="3" fill={color} />
      ))}
      {coords.map(
        (c, i) =>
          i % labelStride === 0 && (
            <text
              key={`label-${c.label}`}
              x={c.x}
              y={height - paddingY + 16}
              fontSize="9"
              textAnchor="middle"
              fill="#9ca3af"
            >
              {c.label}
            </text>
          ),
      )}
    </svg>
  );
}

export default LineChart;
