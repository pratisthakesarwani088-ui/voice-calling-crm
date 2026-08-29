import {
  BookOpen,
  Boxes,
  LayoutDashboard,
  Phone,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";

import { ROUTES } from "./constants.js";

/**
 * Sidebar navigation config — icon + label + path in one place, so the
 * Sidebar component just maps over this array instead of hardcoding
 * each link.
 */
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { key: "customers", label: "Customers", path: ROUTES.CUSTOMERS, icon: Users },
  { key: "products", label: "Products", path: ROUTES.PRODUCTS, icon: Boxes },
  { key: "calls", label: "Calls", path: ROUTES.CALLS, icon: Phone },
  { key: "knowledgeBase", label: "Knowledge Base", path: ROUTES.KNOWLEDGE_BASE, icon: BookOpen },
  { key: "reports", label: "Reports", path: ROUTES.REPORTS, icon: BarChart3 },
  { key: "settings", label: "Settings", path: ROUTES.SETTINGS, icon: Settings },
];

/**
 * Call Status Panel legend — labels/colors are UI convention; `countKey`
 * maps each displayed label to the real, persisted CallStatus this
 * project actually tracks (backend/app/models/enums.py:CallStatus has
 * only 6 values, not 9 — e.g. "Dialing" and "Ringing" aren't
 * distinguished in the schema, so both correctly show the same live
 * "queued" count rather than a fabricated split). See
 * components/CallStatusPanel.jsx for how this drives the live counts
 * now shown here (Dashboard stats/recent calls/recent activity/system
 * status were already real — see services/dashboardService.js, services/callService.js).
 */
export const CALL_STATUSES = [
  { key: "dialing", label: "Dialing", variant: "info", countKey: "queued" },
  { key: "ringing", label: "Ringing", variant: "info", countKey: "queued" },
  { key: "connected", label: "Connected", variant: "progress", countKey: "in_progress" },
  { key: "talking", label: "Talking", variant: "progress", countKey: "in_progress" },
  { key: "completed", label: "Completed", variant: "success", countKey: "completed" },
  { key: "busy", label: "Busy", variant: "danger", countKey: "missed" },
  { key: "no_answer", label: "No Answer", variant: "danger", countKey: "missed" },
  { key: "failed", label: "Failed", variant: "danger", countKey: "failed" },
  { key: "cancelled", label: "Cancelled", variant: "neutral", countKey: "cancelled" },
];
