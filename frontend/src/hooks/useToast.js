import { useContext } from "react";

import { ToastContext } from "../context/ToastContext.jsx";

/**
 * Fire a toast from anywhere: const { showToast } = useToast();
 * showToast("Customer Added", "success").
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return context;
}
