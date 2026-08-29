import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import GlobalSearch from "./GlobalSearch.jsx";
import Logo from "./Logo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

/**
 * Top bar shown above the page content in the authenticated app shell.
 * Search (GlobalSearch) and notifications (NotificationBell) are real,
 * reusing the existing Customer/Product/Knowledge Base list endpoints
 * and the Dashboard's recent-activity data — no new backend endpoints.
 */
function Navbar({ onOpenMobileSidebar, collapsed, onToggleCollapsed }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Collapse toggle — tablet only (desktop/laptop sidebar stays permanent) */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:inline-flex lg:hidden"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      {/* Brand — visible on mobile where the sidebar is hidden by default */}
      <div className="md:hidden">
        <Logo size={30} />
      </div>

      <div className="ml-1 flex-1">
        <GlobalSearch />
      </div>

      <NotificationBell />

      <ProfileMenu />
    </header>
  );
}

export default Navbar;
