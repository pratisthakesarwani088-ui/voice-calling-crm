import apiClient from "./apiClient.js";

/**
 * All Knowledge Base backend calls live here — components never call
 * axios directly. Mirrors services/customerService.js's pattern.
 */

function toKnowledgePayload({ productId, title, question, answer, keywords, category, priority, status }) {
  return {
    product_id: Number(productId),
    title,
    question,
    answer,
    // Backend accepts either a list or a comma-separated string —
    // sending the raw string keeps this mapping trivial; normalization
    // happens server-side (see backend/app/schemas/knowledge_base.py).
    keywords: keywords || "",
    category,
    priority,
    status,
  };
}

export async function createKnowledgeEntry(formValues) {
  const response = await apiClient.post(
    "/api/v1/knowledge-base",
    toKnowledgePayload(formValues),
  );
  return response.data;
}

export async function updateKnowledgeEntry(entryId, formValues) {
  const response = await apiClient.put(
    `/api/v1/knowledge-base/${entryId}`,
    toKnowledgePayload(formValues),
  );
  return response.data;
}

export async function deleteKnowledgeEntry(entryId) {
  const response = await apiClient.delete(`/api/v1/knowledge-base/${entryId}`);
  return response.data;
}

/**
 * `params` mirrors the backend's query params directly:
 * { search, category, status, sort, page, page_size }
 */
export async function listKnowledgeEntries(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  const response = await apiClient.get("/api/v1/knowledge-base", { params: cleanParams });
  return response.data; // { items, total, page, page_size, total_pages }
}
