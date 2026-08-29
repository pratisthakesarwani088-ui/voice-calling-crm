# components/charts/

Small, dependency-free SVG chart primitives for Reports (Module 10).

- `LineChart.jsx` — generic time-series chart, takes `points: [{label, count}]`
- `PieChart.jsx` — generic donut chart, takes `segments: [{label, value, color}]`
- `BarChart.jsx` — generic bar comparison, takes `bars: [{label, value, color}]`

No charting library was already in this project, and one couldn't be
installed/verified in this sandbox — see docs/call-history-reports.md's
Self Review for the reasoning. All three are generic (not calls-specific)
so a future module can reuse them for other data.
