import { LogOut, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import Logo from "./Logo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { NAV_ITEMS } from "../utils/dashboardData.js";

/**
 * Left navigation.
 *
 * Responsive behavior (see DashboardLayout.jsx for the state that
 * drives this):
 *  - Mobile (<md):  hidden off-canvas; slides in as an overlay drawer
 *    when `mobileOpen` is true (hamburger toggle lives in Navbar).
 *  - Tablet (md):    always in the layout flow, but can collapse to an
 *    icon-only rail via `collapsed`.
 *  - Laptop/Desktop (lg+): always visible, always full width —
 *    `collapsed` is ignored at this breakpoint (see the `lg:w-64`
 *    override below).
 *
 * Only "Dashboard" points at a real page; every other item routes to
 * <ComingSoonPage /> (wired up in App.jsx) — this component doesn't
 * know or care which is which, it just renders NAV_ITEMS.
 */
function Sidebar({ mobileOpen, collapsed, onCloseMobile }) {
  const { logout } = useAuth();

  const widthClass = collapsed ? "w-20" : "w-64";

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 ${widthClass} lg:w-64`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          <Logo size={34} withWordmark={!collapsed} wordmarkClassName="text-sm lg:text-base" />
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ key, label, path, icon: Icon }) => (
            <NavLink
              key={key}
              to={path}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? "lg:justify-start justify-center" : ""
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span className={collapsed ? "hidden lg:inline" : "inline"}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Logout" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 ${
              collapsed ? "lg:justify-start justify-center" : ""
            }`}
          >
            <LogOut size={18} strokeWidth={2} className="shrink-0" />
            <span className={collapsed ? "hidden lg:inline" : "inline"}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
