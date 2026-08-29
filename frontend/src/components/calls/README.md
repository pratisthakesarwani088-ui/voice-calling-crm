# components/calls/

Feature-specific components for Hybrid Voice Calling (Module 9).

- `CallLifecycleIndicator.jsx` — the Ready/Ringing/Connecting/Connected/
  Speaking/Listening/Ended/Failed badge shown during an active call
- `CallInfoPanel.jsx` — Customer Name, Phone Number, Duration, Live Status,
  AI Speaking Indicator (the spec's required live-call display)
- `CallSummaryPanel.jsx` — final transcript/summary/sentiment once a call ends
- `RecentCallsList.jsx` — lightweight recent-calls history (not a full
  paginated Calls management module — out of this module's scope)

Orchestrated by `pages/VoiceCallingPage.jsx`, which owns the call
lifecycle state machine for both Demo and Real modes.

Call History (Module 10):
- `CallHistoryFilters.jsx` — search/mode/status/date-range controls
- `CallHistoryTable.jsx` — list table; reuses `ActionButtons` (view/delete only) and `Badge`
- `CallDetailsModal.jsx` — full call detail view with transcript and
  Play Recording (or "No Recording Available")

Orchestrated by `pages/CallHistoryPage.jsx`.
