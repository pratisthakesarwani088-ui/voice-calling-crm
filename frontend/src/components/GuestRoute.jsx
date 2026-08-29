import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";

/**
 * Wrap guest-only routes (login/signup) with this. An already logged-in
 * user who navigates to /login is sent straight to /dashboard instead
 * of seeing the login form again.
 */
function GuestRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
