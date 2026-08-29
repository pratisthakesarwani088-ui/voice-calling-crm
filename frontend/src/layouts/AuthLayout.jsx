import { Outlet } from "react-router-dom";

import Logo from "../components/Logo.jsx";
import { BRAND } from "../utils/constants.js";

/**
 * Shared shell for guest-only pages (login/signup): a centered card on
 * a plain background, no app sidebar/navbar — kept separate from
 * DashboardLayout since the auth pages shouldn't show CRM navigation
 * before the user is logged in. Carries the same TechNova Electronics
 * branding used everywhere else (Module 4 — logo is not redesigned
 * again after this).
 */
function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={48} />
          <h1 className="mt-3 text-lg font-semibold text-gray-900">{BRAND.name}</h1>
          <p className="text-xs text-gray-400">{BRAND.tagline}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
