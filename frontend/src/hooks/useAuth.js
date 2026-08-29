import { useContext } from "react";

import { AuthContext } from "../context/AuthContext.jsx";

/**
 * Access the current auth state ({ user, isAuthenticated, login,
 * register, logout, ... }) from any component. Throws early with a
 * clear message if used outside <AuthProvider> instead of failing
 * silently with a confusing null-reference error later.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
}
