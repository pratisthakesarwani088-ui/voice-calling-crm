import apiClient from "./apiClient.js";

/**
 * Calls the backend's /health endpoint.
 *
 * This is the only API call in Module 1 — it exists to prove the
 * frontend and backend are wired together correctly end-to-end.
 */
export async function checkBackendHealth() {
  const response = await apiClient.get("/api/v1/health");
  return response.data;
}
