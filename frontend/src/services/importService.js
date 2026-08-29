import apiClient from "./apiClient.js";

/**
 * All Data Import backend calls live here — components never call
 * axios directly. Uses multipart/form-data for file uploads; each call
 * explicitly clears apiClient's default JSON Content-Type header so
 * axios/the browser can compute the correct multipart boundary itself.
 */

export async function previewImport(entity, file) {
  const formData = new FormData();
  formData.append("file", file);
  // Explicitly clear the instance's default "application/json" header —
  // axios/the browser needs to set "multipart/form-data; boundary=..."
  // itself for a FormData body, and won't override an already-set header.
  const response = await apiClient.post(`/api/v1/import/${entity}/preview`, formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data; // ImportPreviewResponse
}

export async function executeImport(entity, file, { strategy, duplicateHandling, onUploadProgress }) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(`/api/v1/import/${entity}`, formData, {
    params: { strategy, duplicate_handling: duplicateHandling },
    headers: { "Content-Type": undefined },
    onUploadProgress,
  });
  return response.data; // ImportSummary
}

/**
 * Downloads a sample template and triggers a browser save-as, using a
 * blob response (not a plain <a href>) so the request goes through
 * apiClient and carries the JWT the endpoint requires.
 */
export async function downloadTemplate(entity, format) {
  const response = await apiClient.get(`/api/v1/import/${entity}/template`, {
    params: { format },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${entity}_template.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
