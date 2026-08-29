import Badge from "../Badge.jsx";
import { CALL_STATUS_VARIANT, formatDuration } from "../../utils/callOptions.js";

const SENTIMENT_VARIANT = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
  unknown: "neutral",
};

/**
 * Shown once a call finishes - the saved Call record's transcript,
 * summary, sentiment, and final status/duration. Every call is already
 * saved to the database by this point (see pages/VoiceCallingPage.jsx).
 */
function CallSummaryPanel({ call }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Call Summary</h3>
        <div className="flex gap-2">
          <Badge
            label={call.status.replace("_", " ")}
            variant={CALL_STATUS_VARIANT[call.status] || "neutral"}
            className="capitalize"
          />
          <Badge
            label={call.sentiment}
            variant={SENTIMENT_VARIANT[call.sentiment] || "neutral"}
            className="capitalize"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-2.5 text-center">
          <p className="text-sm font-semibold text-gray-800">{call.customer_name}</p>
          <p className="text-xs text-gray-500">Customer</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2.5 text-center">
          <p className="text-sm font-semibold text-gray-800">{call.product_name || "—"}</p>
          <p className="text-xs text-gray-500">Product</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2.5 text-center">
          <p className="text-sm font-semibold text-gray-800">{formatDuration(call.duration)}</p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2.5 text-center">
          <p className="text-sm font-semibold capitalize text-gray-800">{call.mode}</p>
          <p className="text-xs text-gray-500">Mode</p>
        </div>
      </div>

      {call.ai_summary && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            AI Summary
          </p>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{call.ai_summary}</p>
        </div>
      )}

      {call.transcript && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
            View full transcript
          </summary>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {call.transcript}
          </p>
        </details>
      )}
    </div>
  );
}

export default CallSummaryPanel;
