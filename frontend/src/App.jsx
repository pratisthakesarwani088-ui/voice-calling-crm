import { Routes, Route } from "react-router-dom";

import GuestRoute from "./components/GuestRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AIAssistantPage from "./pages/AIAssistantPage.jsx";
import CallHistoryPage from "./pages/CallHistoryPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ImportCenterPage from "./pages/ImportCenterPage.jsx";
import KnowledgeBasePage from "./pages/KnowledgeBasePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import VoiceCallingPage from "./pages/VoiceCallingPage.jsx";
import { ROUTES } from "./utils/constants.js";

/**
 * Route map.
 *
 * Module 1 provided the home page and 404. Module 3 added authentication.
 * Module 4 added the authenticated app shell (DashboardLayout: sidebar +
 * navbar) with every sidebar item pointing at <ComingSoonPage />. Module 5
 * made "Customers" the first real section. Module 6 makes "Products" and
 * "Knowledge Base" real too. Module 7 adds the Import Center (/import) —
 * reachable via the Dashboard's "Import CSV" quick action and a small
 * "Import" button on each management page. Module 8 adds the AI Assistant
 * (/ai-assistant), reachable via a small "Ask AI" button on the Product
 * View modal. Module 9 makes the Sidebar's pre-existing "Calls" entry
 * (built in Module 4, always pointing at /calls) real too. Module 10
 * makes the Sidebar's pre-existing "Reports" entry real too (same
 * pattern), and adds Call History (/call-history), reachable via a
 * small "View All" link on the Voice Calling page's Recent Calls
 * section — not a new sidebar item. Module 11 makes the Sidebar's
 * pre-existing "Settings" entry real too (same pattern).
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
              <Route path={ROUTES.IMPORT} element={<ImportCenterPage />} />
              <Route path={ROUTES.AI_ASSISTANT} element={<AIAssistantPage />} />
              <Route path={ROUTES.CALLS} element={<VoiceCallingPage />} />
              <Route path={ROUTES.CALL_HISTORY} element={<CallHistoryPage />} />
              <Route path={ROUTES.KNOWLEDGE_BASE} element={<KnowledgeBasePage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<AuthLayout />}>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
