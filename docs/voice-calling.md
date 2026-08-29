# Hybrid Voice Calling - Module 9

## Overview

Two ways to place an AI voice call, both grounded in the same database
context Module 8's Ask AI uses (Product + Knowledge Base + Customer,
via the shared `build_grounded_context` helper):

- **Demo Call** - a fully local simulation. Gemini writes a realistic
  transcript + summary from the grounded context; no Vapi/ElevenLabs
  call happens at all. Fully testable without any voice-provider keys.
- **Real Call** - Vapi places an actual outbound call, configured to
  speak using ElevenLabs as its text-to-speech voice.

## Architecture - three layers

```
app/services/voice_call_service.py   <- low-level, reusable
    start_vapi_call() / get_vapi_call() / end_vapi_call()
    The ONLY place that talks to Vapi's REST API. Mirrors Module 8's
    ai_service.py shape exactly.

app/services/call_service.py         <- CRM orchestration
    start_demo_call() / start_real_call() / refresh_call_status() / end_call()
    Builds context via ai_context_service.build_grounded_context()
    (reused unchanged from Module 8), then either asks Gemini to
    simulate a call (Demo) or asks Vapi to place one (Real). Saves
    every call to the existing Calls table.

app/routes/calls.py                  <- thin HTTP layer
    JWT-protected, maps exceptions to status codes.
```

ElevenLabs is never called directly by this backend - Vapi is told
which ElevenLabs voice to use (`voice: {provider: "11labs", voiceId}`
in the assistant config) and handles that integration internally. This
is the standard way these two services combine.

## Database changes

`calls` table extended (Module 2's table, never recreated):
- `mode` (enum: demo/real) - NOT NULL, added directly since the table
  was empty (no prior module ever wrote to it)
- `product_id` (nullable FK to products.id, ON DELETE SET NULL) - a
  call's grounding context; SET NULL (not CASCADE) so call history
  survives a later product deletion
- `external_call_id` (nullable string) - Vapi's call id, for Real
  calls only, used to poll status

Migration: `backend/alembic/versions/20260819_0900_841762267d5e_extend_calls_for_voice_calling.py`

Every field the spec asks to store - Customer, Start Time, End Time,
Duration, Status, Summary - maps directly onto columns Module 2 already
defined (`customer_id`, `started_at`, `ended_at`, `duration`, `status`,
`ai_summary`); no redundant new columns for those.

## Call lifecycle vs. persisted status

Two distinct vocabularies, intentionally:
- **Lifecycle** (Ready -> Ringing -> Connecting -> Connected -> Speaking/
  Listening -> Ended/Failed) - client-side session state, shown only
  while a call is actively in progress on screen.
- **CallStatus** (queued/in_progress/completed/failed/missed/cancelled)
  - Module 2's persisted enum, the final saved state.

Only the final state is written to the database; the lifecycle is
transient UI, driven differently per mode (see below).

## Demo Call flow

1. `POST /calls/start` (mode=`demo`) builds grounded context, asks
   Gemini for a structured transcript + summary + sentiment (parsed
   leniently - if Gemini doesn't follow the requested format exactly,
   the raw response is used as both transcript and summary rather than
   losing the content), computes a plausible duration from the
   transcript's turn count, and saves a `COMPLETED` Call row - all in
   one synchronous request.
2. The frontend receives the complete result immediately, but still
   animates through the lifecycle stages over a few seconds for a
   believable experience before revealing the summary.

## Real Call flow

1. `POST /calls/start` (mode=`real`) builds the same grounded context,
   asks Vapi to place the call (with an ElevenLabs voice configured),
   and saves a `QUEUED`/`IN_PROGRESS` Call row with the returned
   `external_call_id`. If Vapi's request itself fails, the row is
   still saved with `status=FAILED` - a failed call is still part of
   the audit trail.
2. The frontend polls `GET /calls/{id}/status` every 2.5s. That route
   asks Vapi for the current status, maps Vapi's vocabulary
   (queued/ringing/in-progress/ended + endedReason) onto our
   `CallStatus` enum, and updates the saved row once the call reaches
   a terminal state (also pulling in Vapi's summary/transcript/
   recording URL if provided).
3. `POST /calls/{id}/end` lets the admin manually hang up - also asks
   Vapi to end the call server-side (best-effort; the local row is
   finalized either way).

**Honest limitation on the AI Speaking Indicator for Real calls**:
Vapi's status-polling API doesn't expose turn-by-turn speaking/
listening events without a websocket connection, which this project
doesn't have. The indicator alternates on each poll while the call is
live - a reasonable, clearly-labeled visual approximation, not a claim
of exact real-time data. Demo mode's indicator, by contrast, is exact -
it's driven by the same timer that paces the simulated transcript.

## Error handling

Both `voice_call_service.py` and `ai_service.py` (reused for Demo)
follow the identical three-exception pattern, mapped to the same HTTP
statuses in `routes/calls.py`:

| Situation | Exception | HTTP status |
|---|---|---|
| Vapi/ElevenLabs not fully configured, or key rejected | `VoiceCallConfigurationError` | 503 |
| Gemini not configured (Demo mode) | `AIConfigurationError` | 503 |
| Request exceeds the configured timeout | `*TimeoutError` | 504 |
| Network error / non-2xx response | `*ServiceError` | 502 |
| `customer_id` / `product_id` don't exist | `CustomerNotFoundError` / `ProductNotFoundError` | 404 |
| `call_id` doesn't exist | `CallNotFoundError` | 404 |

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `VAPI_API_KEY` | *(empty)* | From https://dashboard.vapi.ai |
| `VAPI_API_BASE_URL` | `https://api.vapi.ai` | Vapi REST base URL |
| `VAPI_PHONE_NUMBER_ID` | *(empty)* | The Vapi-registered number to call from |
| `VAPI_TIMEOUT_SECONDS` | `20` | Request timeout |
| `ELEVENLABS_API_KEY` | *(empty)* | From https://elevenlabs.io/app/settings/api-keys - not called directly; passed through conceptually via Vapi's own ElevenLabs integration, configured in the Vapi dashboard |
| `ELEVENLABS_VOICE_ID` | *(empty)* | Which ElevenLabs voice Vapi should speak with |

Leave any of these unset to keep Real Call mode disabled - Demo Call
works with only `GEMINI_API_KEY` (Module 8) configured.

## API

All under `API_V1_PREFIX/calls`, JWT-protected.

| Method | Path | Purpose |
|---|---|---|
| POST | `/calls/start` | Start a Demo or Real call |
| GET | `/calls/{id}` | Get a call's current saved state |
| GET | `/calls/{id}/status` | Poll live status (Real calls); no-op for Demo/finalized calls |
| POST | `/calls/{id}/end` | Manually finalize a call |
| GET | `/calls` | Recent calls (optional `customer_id` filter, `limit`) |

## Frontend

- `pages/VoiceCallingPage.jsx` - customer/product/mode picker, live
  call view, summary, recent calls list
- `components/calls/` - `CallLifecycleIndicator`, `CallInfoPanel`,
  `CallSummaryPanel`, `RecentCallsList`
- `services/callService.js`
- Entry points, no new Sidebar item:
  - The Sidebar's pre-existing **"Calls"** nav item (built in Module 4,
    always pointing at `/calls`) now renders this page instead of
    `ComingSoonPage` - the same pattern Modules 5/6 used for Customers/
    Products/Knowledge Base
  - The Customers table's **Call** action button (Module 5's exact
    placeholder - "Voice Calling will be available in Module 9.") now
    navigates here with that customer pre-selected

## Manual testing steps

**Demo Call (fully testable without Vapi/ElevenLabs)**:
```bash
BASE=http://localhost:8000/api/v1
curl -X POST $BASE/calls/start -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"product_id":1,"mode":"demo"}'
# -> 201, a completed Call with a Gemini-generated transcript/summary/sentiment
```

**Real Call**:
```bash
curl -X POST $BASE/calls/start -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"product_id":1,"mode":"real"}'
# Without Vapi configured -> 503 "Real Call mode is not configured"
# With Vapi configured -> 201, a queued/in-progress Call with external_call_id

# Poll status
curl $BASE/calls/<id>/status -H "Authorization: Bearer <token>"

# End it manually
curl -X POST $BASE/calls/<id>/end -H "Authorization: Bearer <token>"
```

**Other checks**:
```bash
curl $BASE/calls -H "Authorization: Bearer <token>"          # recent calls
curl $BASE/calls?customer_id=1 -H "Authorization: Bearer <token>"  # filtered
curl -X POST $BASE/calls/start -d '{"customer_id":1,"product_id":1,"mode":"demo"}'  # no token -> 401
curl -X POST $BASE/calls/start -H "Authorization: Bearer <token>" \
  -d '{"customer_id":999999,"product_id":1,"mode":"demo"}'   # bad customer -> 404
```

**Frontend**
1. Customers page - click the **Call** icon on any row - lands on the Calls page with that customer pre-selected.
2. Or: Sidebar - **Calls** - pick a customer and product manually.
3. Select **Demo Call**, submit - watch the lifecycle animate Ready -> Ringing -> Connecting -> Connected -> Speaking/Listening cycling -> Ended, then see the transcript/summary/sentiment.
4. Select **Real Call** without Vapi configured - clear error shown, no crash.
5. With Vapi/ElevenLabs configured, place a Real call - watch status update via polling; use **End Call** to hang up manually.
6. Check **Recent Calls** at the bottom of the page updates after each call.
7. Confirm Customers/Products/Knowledge Base/Import/AI Assistant pages still work exactly as before.
8. Resize through mobile/tablet/laptop/desktop - the call panel, lifecycle indicator, and summary all reflow correctly.
