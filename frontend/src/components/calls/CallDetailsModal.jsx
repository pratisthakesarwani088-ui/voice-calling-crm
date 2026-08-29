import { Download } from "lucide-react";

import Badge from "../Badge.jsx";
import Modal from "../Modal.jsx";
import { CALL_STATUS_VARIANT, formatDuration } from "../../utils/callOptions.js";

const SENTIMENT_VARIANT = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
  unknown: "neutral",
};

/**
 * Read-only detail view for a single call - mirrors
 * components/customers/CustomerViewModal.jsx's pattern. Shows the full
 * transcript and, per the Module 10 spec, either a Play Recording
 * control (if `recording_url` exists) or a "No Recording Available"
 * message.
 */
function CallDetailsModal({ isOpen, call, onClose }) {
  if (!call) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call Details" maxWidthClassName="max-w-xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-gray-900">{call.customer_name}</p>
          <p className="text-sm text-gray-500">{call.customer_phone}</p>
        </div>
        <div className="flex gap-2">
          <Badge
            label={call.status.replace("_", " ")}
            variant={CALL_STATUS_VARIANT[call.status] || "neutral"}
            className="capitalize"
          />
          <Badge label={call.mode} variant="info" className="capitalize" />
        </div>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Product</dt>
          <dd className="mt-0.5 text-sm text-gray-800">{call.product_name || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Duration</dt>
          <dd className="mt-0.5 text-sm text-gray-800">{formatDuration(call.duration)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Sentiment</dt>
          <dd className="mt-0.5">
            <Badge
              label={call.sentiment}
              variant={SENTIMENT_VARIANT[call.sentiment] || "neutral"}
              className="capitalize"
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Started</dt>
          <dd className="mt-0.5 text-sm text-gray-800">
            {new Date(call.started_at).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Ended</dt>
          <dd className="mt-0.5 text-sm text-gray-800">
            {call.ended_at ? new Date(call.ended_at).toLocaleString() : "—"}
          </dd>
        </div>
      </dl>

      <div className="mb-4">
        {call.recording_url ? (
          <>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              Play Recording
            </p>
            <audio controls src={call.recording_url} className="w-full" />
            <a
              href={call.recording_url}
              download
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} />
              Download Recording
            </a>
          </>
        ) : (
          <>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              Recording
            </p>
            <p className="text-sm text-gray-400">No Recording Available</p>
          </>
        )}
      </div>

      {call.ai_summary && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            AI Summary
          </p>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{call.ai_summary}</p>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          Transcript
        </p>
        {call.transcript ? (
          <p className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {call.transcript}
          </p>
        ) : (
          <p className="text-sm text-gray-400">No transcript available.</p>
        )}
      </div>
    </Modal>
  );
}

export default CallDetailsModal;
