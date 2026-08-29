import apiClient from "./apiClient.js";

/**
 * Dashboard backend call - components never call axios directly (see
 * services/README.md). Recent Calls is served by the existing
 * callService.listCalls() (Module 10), not duplicated here.
 */
export async function getDashboard() {
  const response = await apiClient.get("/api/v1/dashboard");
  return response.data; // { stats, system_status, recent_activity }
}
