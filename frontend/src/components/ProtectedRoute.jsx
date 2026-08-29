import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";

/**
 * Wrap protected routes with this (see App.jsx). Unauthenticated users
 * are redirected to /login; the page they were trying to reach is kept
 * in location state so LoginPage can send them back after logging in.
 */
function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    // Avoid a flash-redirect to /login while we're still checking an
    // existing token on page load.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
