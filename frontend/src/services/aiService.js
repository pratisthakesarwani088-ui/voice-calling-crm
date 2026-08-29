import apiClient from "./apiClient.js";

/**
 * All AI Assistant backend calls live here - components never call
 * axios directly (see services/README.md).
 */

export async function askAI({ question, productId, customerId }) {
  const response = await apiClient.post("/api/v1/ai/ask", {
    question,
    product_id: Number(productId),
    customer_id: customerId ? Number(customerId) : null,
  });
  return response.data; // AIAskResponse
}
