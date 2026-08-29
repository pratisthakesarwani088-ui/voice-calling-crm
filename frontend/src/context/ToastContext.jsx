import { createContext, useCallback, useMemo, useState } from "react";

export const ToastContext = createContext(null);

let nextToastId = 1;

/**
 * Global toast/notification state. Wraps the app (see App.jsx) so any
 * component can fire a toast via the useToast() hook instead of
 * managing its own transient success/error banner — this is what the
 * Module 5 spec's toast list (Customer Added, Updated, Deleted,
 * Duplicate Phone Number, Validation Error) is built on, and it's
 * reusable by any future module's CRUD flows too.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, variant = "success", durationMs = 3500) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (durationMs > 0) {
        setTimeout(() => dismissToast(id), durationMs);
      }
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
