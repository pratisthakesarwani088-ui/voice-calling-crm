import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useToast } from "../hooks/useToast.js";

const VARIANT_CONFIG = {
  success: { icon: CheckCircle2, className: "bg-green-600 text-white" },
  error: { icon: AlertCircle, className: "bg-red-600 text-white" },
  info: { icon: Info, className: "bg-blue-600 text-white" },
};

/**
 * Renders every active toast, stacked in the top-right corner. Mounted
 * once in App.jsx — components never render their own toast markup,
 * they just call useToast().showToast(...).
 */
function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map(({ id, message, variant }) => {
        const { icon: Icon, className } = VARIANT_CONFIG[variant] || VARIANT_CONFIG.success;
        return (
          <div
            key={id}
            role="status"
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${className}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => dismissToast(id)}
              className="shrink-0 opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
