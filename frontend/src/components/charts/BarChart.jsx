/**
 * Minimal, dependency-free SVG bar chart. Generic - takes `bars` as
 * `{label, value, color}`, so it's reusable for any category
 * comparison, not just Success-vs-Failed.
 */
function BarChart({ bars, height = 200 }) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);
  const barWidth = 64;
  const gap = 40;
  const paddingY = 28;
  const width = bars.length * (barWidth + gap) + gap;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto w-full max-w-sm">
      <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke="#e5e7eb" />
      {bars.map((bar, index) => {
        const barHeight = (bar.value / maxValue) * (height - paddingY * 2);
        const x = gap + index * (barWidth + gap);
        const y = height - paddingY - barHeight;
        return (
          <g key={bar.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill={bar.color} />
            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#1f2937"
            >
              {bar.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - paddingY + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
