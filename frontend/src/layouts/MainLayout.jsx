import { Outlet } from "react-router-dom";

/**
 * Shared page shell.
 *
 * Module 1 keeps this minimal (just a header + content area) so future
 * modules can extend it with a sidebar, nav links, and auth-aware UI
 * without restructuring routes.
 */
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          AI Voice Calling CRM
        </h1>
      </header>

      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="px-6 py-4 text-center text-sm text-gray-400">
        AI Voice Calling CRM — Foundation Build
      </footer>
    </div>
  );
}

export default MainLayout;
