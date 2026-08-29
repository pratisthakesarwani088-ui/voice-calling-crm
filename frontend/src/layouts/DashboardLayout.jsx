import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

/**
 * Shell for every authenticated page (Dashboard + all the sidebar's
 * "Coming Soon" sections). Owns the two pieces of responsive sidebar
 * state and passes them down:
 *
 *  - `mobileOpen`: is the off-canvas drawer open (mobile only)
 *  - `collapsed`:  is the sidebar in icon-only mode (tablet only —
 *    ignored at lg+, where the sidebar is always full width)
 */
function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
