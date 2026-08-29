import apiClient from "./apiClient.js";

/**
 * All Product Management backend calls live here — components never
 * call axios directly. Mirrors services/customerService.js's pattern.
 */

function toProductPayload({
  productName,
  category,
  brand,
  modelNumber,
  sku,
  price,
  discount,
  stockQuantity,
  warranty,
  description,
  features,
  specifications,
  availabilityStatus,
}) {
  return {
    product_name: productName,
    category,
    brand,
    model_number: modelNumber || null,
    sku,
    price: price === "" ? 0 : Number(price),
    discount: discount === "" ? 0 : Number(discount),
    stock_quantity: stockQuantity === "" ? 0 : Number(stockQuantity),
    warranty: warranty || null,
    description: description || null,
    features: features || null,
    specifications: specifications || null,
    availability_status: availabilityStatus,
  };
}

export async function createProduct(formValues) {
  const response = await apiClient.post("/api/v1/products", toProductPayload(formValues));
  return response.data;
}

export async function updateProduct(productId, formValues) {
  const response = await apiClient.put(
    `/api/v1/products/${productId}`,
    toProductPayload(formValues),
  );
  return response.data;
}

export async function deleteProduct(productId) {
  const response = await apiClient.delete(`/api/v1/products/${productId}`);
  return response.data;
}

/**
 * `params` mirrors the backend's query params directly:
 * { search, category, brand, availability, sort, page, page_size }
 */
export async function listProducts(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  const response = await apiClient.get("/api/v1/products", { params: cleanParams });
  return response.data; // { items, total, page, page_size, total_pages }
}
