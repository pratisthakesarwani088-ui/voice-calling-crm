/**
 * App-wide constants shared across services/context/components.
 *
 * Not environment configuration (that belongs in .env / import.meta.env
 * — see services/apiClient.js) — these are internal, non-secret values
 * that are still worth defining once instead of repeating as string
 * literals in multiple files.
 */

// localStorage key used to persist the JWT between page reloads.
export const AUTH_TOKEN_STORAGE_KEY = "ai_voice_crm_auth_token";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  CUSTOMERS: "/customers",
  PRODUCTS: "/products",
  CALLS: "/calls",
  KNOWLEDGE_BASE: "/knowledge-base",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  IMPORT: "/import",
  AI_ASSISTANT: "/ai-assistant",
  CALL_HISTORY: "/call-history",
};

// Fictional company this CRM instance is branded for (Module 4). Defined
// once and reused everywhere the brand appears (landing page, auth
// pages, sidebar, navbar) instead of repeating the name/initials as
// string literals in every component.
export const BRAND = {
  name: "TechNova Electronics",
  shortName: "TechNova",
  initials: "TN",
  tagline: "AI-Powered Customer Engagement",
};
