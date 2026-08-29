import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";
import { AUTH_TOKEN_STORAGE_KEY } from "../utils/constants.js";

export const AuthContext = createContext(null);

/**
 * Holds the single source of truth for "who is logged in" and exposes
 * login/register/logout actions. Wraps the whole app (see App.jsx) so
 * any component can reach it via the useAuth() hook instead of prop
 * drilling.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On first load, if a token is already stored (e.g. page refresh),
  // validate it against the backend and restore the session.
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      setIsInitializing(false);
      return;
    }

    fetchCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        // Token is invalid/expired — clear it rather than leaving a
        // stale, unusable token in storage.
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formValues) => {
    // Registration does not log the user in automatically — they're
    // sent to the login page after a successful signup.
    return registerUser(formValues);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Always clear local state, even if the network call fails —
      // the user's intent to log out should never get "stuck".
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, isInitializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
