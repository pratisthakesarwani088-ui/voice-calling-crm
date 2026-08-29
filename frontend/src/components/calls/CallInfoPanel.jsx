import { Volume2 } from "lucide-react";

import CallLifecycleIndicator from "./CallLifecycleIndicator.jsx";
import { formatDuration } from "../../utils/callOptions.js";

/**
 * The Module 9 spec's required live-call display: Customer Name, Phone
 * Number, Call Duration, Live Status, and an AI Speaking Indicator.
 *
 * `isAiSpeaking` is exact for Demo calls (driven by the transcript
 * simulation timer) and a best-effort visual toggle for Real calls,
 * since Vapi's status-polling API doesn't expose turn-by-turn speaking
 * events without a websocket connection - see VoiceCallingPage.jsx.
 */
function CallInfoPanel({ customerName, phoneNumber, durationSeconds, stage, isAiSpeaking }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">{customerName}</p>
          <p className="text-sm text-gray-500">{phoneNumber}</p>
        </div>
        <CallLifecycleIndicator stage={stage} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-800">
            {formatDuration(durationSeconds)}
          </p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-800">{stage}</p>
          <p className="text-xs text-gray-500">Live Status</p>
        </div>
        <div
          className={`col-span-2 flex items-center justify-center gap-2 rounded-lg p-3 text-center sm:col-span-1 ${
            isAiSpeaking ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-400"
          }`}
        >
          <Volume2 size={16} className={isAiSpeaking ? "animate-pulse" : ""} />
          <span className="text-xs font-medium">
            {isAiSpeaking ? "AI Speaking" : "AI Silent"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CallInfoPanel;
