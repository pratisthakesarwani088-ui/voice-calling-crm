import apiClient from "./apiClient.js";

/**
 * All Settings backend calls live here - components never call axios
 * directly (see services/README.md).
 */

export async function getSettings() {
  const response = await apiClient.get("/api/v1/settings");
  return response.data;
}

export async function updateSettings(payload) {
  const response = await apiClient.put("/api/v1/settings", payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await apiClient.post("/api/v1/settings/change-password", payload);
  return response.data;
}

export async function testAI(payload) {
  const response = await apiClient.post("/api/v1/settings/test-ai", payload);
  return response.data;
}

export async function testVoice(payload) {
  const response = await apiClient.post("/api/v1/settings/test-voice", payload);
  return response.data;
}

export async function testTelephony(payload) {
  const response = await apiClient.post("/api/v1/settings/test-telephony", payload);
  return response.data;
}
