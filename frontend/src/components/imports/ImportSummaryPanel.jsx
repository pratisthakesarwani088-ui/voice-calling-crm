import { Download } from "lucide-react";

const SUMMARY_FIELDS = [
  { key: "total_rows", label: "Total Rows" },
  { key: "imported", label: "Imported", className: "text-green-600" },
  { key: "skipped", label: "Skipped", className: "text-gray-500" },
  { key: "failed", label: "Failed", className: "text-red-600" },
  { key: "duplicates", label: "Duplicates", className: "text-amber-600" },
  { key: "validation_errors", label: "Validation Errors", className: "text-red-600" },
];

/**
 * Builds and downloads a CSV of failed rows + reasons, client-side,
 * from data already returned by the import endpoint — no extra API
 * round-trip needed (see services/importService.js's docstring).
 */
function downloadErrorReport(entityLabel, failedRows) {
  const dataColumns = Array.from(new Set(failedRows.flatMap((row) => Object.keys(row.data))));
  const header = ["row_number", "reasons", ...dataColumns];

  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = [
    header.map(escapeCsv).join(","),
    ...failedRows.map((row) =>
      [row.row_number, row.errors.join(" | "), ...dataColumns.map((col) => row.data[col] || "")]
        .map(escapeCsv)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${entityLabel.toLowerCase().replace(/\s+/g, "_")}_import_errors.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function ImportSummaryPanel({ summary, entityLabel }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SUMMARY_FIELDS.map(({ key, label, className }) => (
          <div key={key} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className={`text-xl font-semibold text-gray-800 ${className || ""}`}>
              {summary[key]}
            </p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {summary.failed_rows.length > 0 && (
        <button
          type="button"
          onClick={() => downloadErrorReport(entityLabel, summary.failed_rows)}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} />
          Download Error Report
        </button>
      )}
    </div>
  );
}

export default ImportSummaryPanel;
