/**
 * Shared, non-secret config for Product Management — mirrors
 * utils/customerOptions.js's pattern from Module 5.
 */

// Matches backend/app/models/enums.py:ProductAvailability values exactly.
export const PRODUCT_AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" },
];

export const PRODUCT_AVAILABILITY_VARIANT = {
  in_stock: "success",
  out_of_stock: "danger",
  discontinued: "neutral",
};

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

// Matches backend/app/schemas/product.py:PRODUCTS_DEFAULT_PAGE_SIZE.
export const PRODUCTS_PAGE_SIZE = 10;

/**
 * Mirrors backend/app/services/product_service.py:compute_final_price —
 * used for a live preview in the form before Save; the backend always
 * recomputes authoritatively, this is UX only.
 */
export function computeFinalPrice(price, discount) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  const final = p - d;
  return final > 0 ? final : 0;
}
