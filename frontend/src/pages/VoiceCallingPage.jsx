import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import CallInfoPanel from "../components/calls/CallInfoPanel.jsx";
import CallSummaryPanel from "../components/calls/CallSummaryPanel.jsx";
import RecentCallsList from "../components/calls/RecentCallsList.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../hooks/useToast.js";
import { endCall, getCallStatus, listRecentCalls, startCall } from "../services/callService.js";
import { listCustomers } from "../services/customerService.js";
import { listProducts } from "../services/productService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { CALL_LIFECYCLE, CALL_MODE_OPTIONS } from "../utils/callOptions.js";
import { ROUTES } from "../utils/constants.js";

const LOOKUP_PAGE_SIZE = 100;
const REAL_CALL_POLL_INTERVAL_MS = 2500;
const TERMINAL_STATUSES = ["completed", "failed", "missed", "cancelled"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Voice Calling (Module 9). Demo Call fully simulates the lifecycle
 * client-side around a single synchronous backend call (which itself
 * uses Gemini to write a grounded transcript — see
 * backend/app/services/call_service.py). Real Call places an actual
 * Vapi/ElevenLabs call and polls GET /calls/{id}/status for live
 * updates, since there's no websocket/webhook channel in this project.
 *
 * Reachable from the "Call" action on the Customers table (Module 5's
 * placeholder, now connected) and by navigating here directly — not
 * from a new Sidebar entry, per this module's scope.
 */
function VoiceCallingPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [customerId, setCustomerId] = useState(searchParams.get("customerId") || "");
  const [productId, setProductId] = useState("");
  const [mode, setMode] = useState("demo");
  const [fieldErrors, setFieldErrors] = useState({});

  const [phase, setPhase] = useState("setup"); // setup | calling | finished
  const [stage, setStage] = useState(CALL_LIFECYCLE.READY);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [call, setCall] = useState(null);
  const [callError, setCallError] = useState("");

  const [recentCalls, setRecentCalls] = useState([]);

  // Stage-animation timeouts/intervals (Demo's Ready->Ringing->Connecting
  // chain, Real's status-poll interval) live here.
  const stageTimersRef = useRef([]);
  // The once-per-second "clock" that drives the visible duration while
  // a call is active — kept separate from stageTimersRef so it can be
  // stopped independently the instant a call ends, without depending
  // on a stale closure over `phase` to know when to stop itself.
  const durationIntervalRef = useRef(null);

  function trackStageTimer(id) {
    stageTimersRef.current.push(id);
    return id;
  }

  function clearStageTimers() {
    stageTimersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    stageTimersRef.current = [];
  }

  function stopDurationClock() {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }

  function startDurationClock() {
    stopDurationClock();
    const startTime = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }

  useEffect(
    () => () => {
      clearStageTimers();
      stopDurationClock();
    },
    [],
  );

  useEffect(() => {
    Promise.all([
      listCustomers({ sort: "name_asc", page: 1, page_size: LOOKUP_PAGE_SIZE }),
      listProducts({ sort: "name_asc", page: 1, page_size: LOOKUP_PAGE_SIZE }),
    ])
      .then(([customerData, productData]) => {
        setCustomers(customerData.items);
        setProducts(productData.items);
      })
      .catch(() => {
        setCustomers([]);
        setProducts([]);
      })
      .finally(() => setIsLoadingOptions(false));

    refreshRecentCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshRecentCalls(forCustomerId) {
    listRecentCalls({ customerId: forCustomerId, limit: 8 })
      .then((data) => setRecentCalls(data.items))
      .catch(() => setRecentCalls([]));
  }

  function validate() {
    const errors = {};
    if (!customerId) errors.customerId = "Select a customer.";
    if (!productId) errors.productId = "Select a product to ground the call in.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function finishCall(finalStage, finalCall, toastLabel, toastVariant) {
    clearStageTimers();
    stopDurationClock();
    setIsAiSpeaking(false);
    setStage(finalStage);
    if (finalCall) {
      setCall(finalCall);
      if (finalCall.duration !== null && finalCall.duration !== undefined) {
        setDurationSeconds(finalCall.duration);
      }
    }
    setPhase("finished");
    showToast(toastLabel, toastVariant);
    refreshRecentCalls();
  }

  async function runDemoCall() {
    trackStageTimer(setTimeout(() => setStage(CALL_LIFECYCLE.RINGING), 500));
    trackStageTimer(setTimeout(() => setStage(CALL_LIFECYCLE.CONNECTING), 1600));

    const apiPromise = startCall({ customerId, productId, mode: "demo" });
    const [result] = await Promise.all([apiPromise, delay(2400)]);

    setStage(CALL_LIFECYCLE.CONNECTED);
    await delay(400);

    for (let i = 0; i < 3; i += 1) {
      setStage(CALL_LIFECYCLE.SPEAKING);
      setIsAiSpeaking(true);
      await delay(900);
      setStage(CALL_LIFECYCLE.LISTENING);
      setIsAiSpeaking(false);
      await delay(700);
    }

    finishCall(CALL_LIFECYCLE.ENDED, result, "Call Completed", "success");
  }

  async function runRealCall() {
    setStage(CALL_LIFECYCLE.RINGING);
    const started = await startCall({ customerId, productId, mode: "real" });
    setCall(started);

    if (started.status === "failed") {
      finishCall(CALL_LIFECYCLE.FAILED, started, "Call Failed", "error");
      return;
    }

    setStage(CALL_LIFECYCLE.CONNECTING);

    let speakingToggle = false;
    trackStageTimer(
      setInterval(async () => {
        try {
          const updated = await getCallStatus(started.id);

          if (TERMINAL_STATUSES.includes(updated.status)) {
            finishCall(
              updated.status === "completed" ? CALL_LIFECYCLE.ENDED : CALL_LIFECYCLE.FAILED,
              updated,
              updated.status === "completed" ? "Call Completed" : "Call Failed",
              updated.status === "completed" ? "success" : "error",
            );
            return;
          }

          setCall(updated);
          // Vapi's status-polling API doesn't expose turn-by-turn
          // speaking/listening events — this alternation is an honest,
          // clearly-approximate visual indicator while the call is
          // live, not a claim of real per-turn data.
          speakingToggle = !speakingToggle;
          setStage(speakingToggle ? CALL_LIFECYCLE.SPEAKING : CALL_LIFECYCLE.LISTENING);
          setIsAiSpeaking(speakingToggle);
        } catch (err) {
          setCallError(getErrorMessage(err));
          finishCall(CALL_LIFECYCLE.FAILED, null, "Call Failed", "error");
        }
      }, REAL_CALL_POLL_INTERVAL_MS),
    );
  }

  async function handleStartCall(event) {
    event.preventDefault();
    if (!validate()) return;

    clearStageTimers();
    setCallError("");
    setCall(null);
    setDurationSeconds(0);
    setIsAiSpeaking(false);
    setPhase("calling");
    setStage(CALL_LIFECYCLE.READY);
    showToast("Call Started", "info");
    startDurationClock();

    try {
      if (mode === "demo") {
        await runDemoCall();
      } else {
        await runRealCall();
      }
    } catch (err) {
      setCallError(getErrorMessage(err));
      finishCall(CALL_LIFECYCLE.FAILED, null, "Call Failed", "error");
    }
  }

  async function handleEndCall() {
    if (!call) return;
    try {
      const finalCall = await endCall(call.id);
      finishCall(CALL_LIFECYCLE.ENDED, finalCall, "Call Completed", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  function handleNewCall() {
    clearStageTimers();
    stopDurationClock();
    setPhase("setup");
    setStage(CALL_LIFECYCLE.READY);
    setCall(null);
    setCallError("");
    setDurationSeconds(0);
    setIsAiSpeaking(false);
  }

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          <Phone size={22} className="text-blue-600" />
          Voice Calling
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Start a Demo (simulated) or Real (Vapi + ElevenLabs) call, grounded in your product
          and knowledge base data.
        </p>
      </div>

      {phase === "setup" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleStartCall} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
                <select
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, customerId: undefined }));
                  }}
                  disabled={isLoadingOptions}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.customerId ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.phone})
                    </option>
                  ))}
                </select>
                {fieldErrors.customerId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.customerId}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
                <select
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, productId: undefined }));
                  }}
                  disabled={isLoadingOptions}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.productId ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} ({product.product_code})
                    </option>
                  ))}
                </select>
                {fieldErrors.productId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.productId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Call Mode</label>
              <div className="flex gap-3">
                {CALL_MODE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${
                      mode === option.value
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={(event) => setMode(event.target.value)}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingOptions}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Phone size={16} />
              Start Call
            </button>
          </form>
        </div>
      )}

      {phase === "calling" && selectedCustomer && (
        <div className="space-y-4">
          <CallInfoPanel
            customerName={selectedCustomer.full_name}
            phoneNumber={selectedCustomer.phone}
            durationSeconds={durationSeconds}
            stage={stage}
            isAiSpeaking={isAiSpeaking}
          />
          {/* Demo calls complete automatically in a few seconds and
              never populate `call` until they do, so there's nothing
              for End Call to act on — only Real calls (which save a
              row immediately on start) can be manually hung up. */}
          {mode === "real" && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleEndCall}
                disabled={!call}
                className="flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                <PhoneOff size={16} />
                End Call
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "finished" && (
        <div className="space-y-4">
          {callError && <Alert variant="error" message={callError} />}
          {call && <CallSummaryPanel call={call} />}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleNewCall}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Start Another Call
            </button>
          </div>
        </div>
      )}

      {isLoadingOptions && phase === "setup" && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
          <Spinner className="h-4 w-4" />
          Loading customers and products...
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Calls</h3>
          <Link
            to={ROUTES.CALL_HISTORY}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>
        <RecentCallsList calls={recentCalls} />
      </div>
    </div>
  );
}

export default VoiceCallingPage;
