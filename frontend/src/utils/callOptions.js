/**
 * Shared, non-secret config for Voice Calling (Module 9).
 * Mirrors backend/app/models/enums.py:CallMode/CallStatus values exactly.
 */

export const CALL_MODE_OPTIONS = [
  { value: "demo", label: "Demo Call" },
  { value: "real", label: "Real Call" },
];

// The Module 9 spec's exact call lifecycle. This is a CLIENT-SIDE
// session state, distinct from the database's persisted CallStatus
// (queued/in_progress/completed/failed/missed/cancelled) - see
// pages/VoiceCallingPage.jsx for how one maps to the other.
export const CALL_LIFECYCLE = {
  READY: "Ready",
  RINGING: "Ringing",
  CONNECTING: "Connecting",
  CONNECTED: "Connected",
  SPEAKING: "Speaking",
  LISTENING: "Listening",
  ENDED: "Ended",
  FAILED: "Failed",
};

export const CALL_LIFECYCLE_VARIANT = {
  [CALL_LIFECYCLE.READY]: "neutral",
  [CALL_LIFECYCLE.RINGING]: "info",
  [CALL_LIFECYCLE.CONNECTING]: "info",
  [CALL_LIFECYCLE.CONNECTED]: "progress",
  [CALL_LIFECYCLE.SPEAKING]: "progress",
  [CALL_LIFECYCLE.LISTENING]: "progress",
  [CALL_LIFECYCLE.ENDED]: "success",
  [CALL_LIFECYCLE.FAILED]: "danger",
};

// Maps the database's persisted CallStatus (from CallOut.status) to a
// Badge variant - used for the Recent Calls list, which shows saved
// records, not the live in-session lifecycle above.
export const CALL_STATUS_VARIANT = {
  queued: "info",
  in_progress: "progress",
  completed: "success",
  failed: "danger",
  missed: "danger",
  cancelled: "neutral",
};

// Module 10: Call History's status filter dropdown options.
export const CALL_STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

export function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "--:--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
