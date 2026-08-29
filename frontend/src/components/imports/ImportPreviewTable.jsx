import Badge from "../Badge.jsx";

const STATUS_VARIANT = { valid: "success", invalid: "danger", duplicate: "progress" };

/**
 * Shows the first 20 rows returned by the preview endpoint, with each
 * row's validation status and any errors. `headers` drives the column
 * order so it matches whatever the uploaded file actually contained.
 */
function ImportPreviewTable({ headers, rows }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">No rows to preview.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Status</th>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">
                {header}
              </th>
            ))}
            <th className="px-3 py-2 font-medium">Errors</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.row_number} className={row.status === "invalid" ? "bg-red-50/40" : ""}>
              <td className="px-3 py-2 text-gray-400">{row.row_number}</td>
              <td className="px-3 py-2">
                <Badge label={row.status} variant={STATUS_VARIANT[row.status]} className="capitalize" />
              </td>
              {headers.map((header) => (
                <td key={header} className="max-w-[160px] truncate px-3 py-2 text-gray-700">
                  {row.data[header] || "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-red-600">{row.errors.join("; ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ImportPreviewTable;
