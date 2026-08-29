import { PhoneCall } from "lucide-react";

import Badge from "../Badge.jsx";
import { CALL_LIFECYCLE, CALL_LIFECYCLE_VARIANT } from "../../utils/callOptions.js";

/**
 * Shows the current stage of an active call session (Ready -> Ringing
 * -> Connecting -> Connected -> Speaking/Listening -> Ended/Failed).
 * This is client-side session state - see pages/VoiceCallingPage.jsx
 * for how it's driven for Demo vs Real calls.
 */
function CallLifecycleIndicator({ stage }) {
  const isActive = ![CALL_LIFECYCLE.READY, CALL_LIFECYCLE.ENDED, CALL_LIFECYCLE.FAILED].includes(
    stage,
  );

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isActive ? "animate-pulse bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
        }`}
      >
        <PhoneCall size={18} />
      </span>
      <Badge label={stage} variant={CALL_LIFECYCLE_VARIANT[stage] || "neutral"} />
    </div>
  );
}

export default CallLifecycleIndicator;
