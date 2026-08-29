import apiClient from "./apiClient.js";

/**
 * All Voice Calling backend calls live here - components never call
 * axios directly (see services/README.md).
 */

export async function startCall({ customerId, productId, mode }) {
  const response = await apiClient.post("/api/v1/calls/start", {
    customer_id: Number(customerId),
    product_id: Number(productId),
    mode,
  });
  return response.data; // CallOut
}

export async function getCall(callId) {
  const response = await apiClient.get(`/api/v1/calls/${callId}`);
  return response.data; // CallOut
}

export async function getCallStatus(callId) {
  const response = await apiClient.get(`/api/v1/calls/${callId}/status`);
  return response.data; // CallOut
}

export async function endCall(callId) {
  const response = await apiClient.post(`/api/v1/calls/${callId}/end`);
  return response.data; // CallOut
}

export async function listRecentCalls({ customerId, limit = 10 } = {}) {
  const params = { limit };
  if (customerId) params.customer_id = customerId;
  const response = await apiClient.get("/api/v1/calls", { params });
  return response.data; // { items: CallOut[] }
}

/**
 * Full search/filter/paginated call list (Module 10's Call History).
 * `params` mirrors the backend's query params directly: { search,
 * mode, status, date_from, date_to, sort, page, page_size }.
 */
export async function listCalls(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  const response = await apiClient.get("/api/v1/calls", { params: cleanParams });
  return response.data; // { items, total, page, page_size, total_pages }
}

export async function deleteCall(callId) {
  const response = await apiClient.delete(`/api/v1/calls/${callId}`);
  return response.data; // { message }
}
