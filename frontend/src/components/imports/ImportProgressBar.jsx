/**
 * Progress display for an in-flight import.
 *
 * `uploadPercent` reflects real upload progress (0-100, from axios'
 * onUploadProgress). Once the upload finishes, the file is on the
 * server and being validated/written — there's no further progress
 * event to track for that phase (a single synchronous request/response,
 * not a polled background job), so the bar switches to a labeled
 * "Processing..." state instead of a fabricated number.
 */
function ImportProgressBar({ uploadPercent, isProcessing, imported, skipped, failed, remaining }) {
  const barPercent = isProcessing ? 100 : uploadPercent;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>{isProcessing ? "Processing import..." : `Uploading... ${uploadPercent}%`}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full bg-blue-600 transition-all duration-300 ${
              isProcessing ? "animate-pulse" : ""
            }`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Imported", value: imported, className: "text-green-600" },
          { label: "Skipped", value: skipped, className: "text-gray-500" },
          { label: "Failed", value: failed, className: "text-red-600" },
          { label: "Remaining", value: remaining, className: "text-blue-600" },
        ].map(({ label, value, className }) => (
          <div key={label} className="rounded-lg bg-gray-50 p-2.5 text-center">
            <p className={`text-lg font-semibold ${className}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImportProgressBar;
