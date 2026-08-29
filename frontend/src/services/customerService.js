import apiClient from "./apiClient.js";

/**
 * All Customer Management backend calls live here — components never
 * call axios directly (see services/README.md).
 *
 * Note: GET /customers/{id} exists on the backend (see docs/customers.md)
 * but isn't called from the frontend — View and Edit both reuse the
 * customer row already loaded by listCustomers(), avoiding an extra
 * round-trip. The endpoint stays available for direct API use / a
 * future deep-linked detail page.
 */

function toCustomerPayload({ fullName, phone, email, company, city, state, country, notes, status }) {
  return {
    full_name: fullName,
    phone,
    email: email || null,
    company: company || null,
    city: city || null,
    state: state || null,
    country: country || null,
    notes: notes || null,
    status,
  };
}

export async function createCustomer(formValues) {
  const response = await apiClient.post("/api/v1/customers", toCustomerPayload(formValues));
  return response.data;
}

export async function updateCustomer(customerId, formValues) {
  const response = await apiClient.put(
    `/api/v1/customers/${customerId}`,
    toCustomerPayload(formValues),
  );
  return response.data;
}

export async function deleteCustomer(customerId) {
  const response = await apiClient.delete(`/api/v1/customers/${customerId}`);
  return response.data;
}

/**
 * `params` mirrors the backend's query params directly:
 * { search, status, city, state, sort, page, page_size }
 * Undefined/empty values are stripped so they aren't sent as literal
 * "undefined" strings.
 */
export async function listCustomers(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  const response = await apiClient.get("/api/v1/customers", { params: cleanParams });
  return response.data; // { items, total, page, page_size, total_pages }
}

/**
 * Downloads all customers matching the current filters as a CSV file.
 * Reuses the browser's own download mechanism (a Blob + temporary
 * anchor click) rather than a new dependency.
 */
export async function exportCustomers(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  const response = await apiClient.get("/api/v1/customers/export", {
    params: cleanParams,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = "customers_export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
