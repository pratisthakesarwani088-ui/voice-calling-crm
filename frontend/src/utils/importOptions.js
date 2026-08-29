/**
 * Shared, non-secret config for the Import Center (Module 7).
 * Mirrors backend/app/services/import_config.py's entity keys exactly.
 */

export const IMPORT_ENTITIES = [
  {
    key: "customers",
    label: "Customers",
    description: "Bulk-add or update customer records.",
  },
  {
    key: "products",
    label: "Products",
    description: "Bulk-add or update your product catalog.",
  },
  {
    key: "knowledge-base",
    label: "Knowledge Base",
    description: "Bulk-add Q&A entries linked to existing products.",
  },
];

export const ALLOWED_IMPORT_EXTENSIONS = [".csv", ".xlsx"];
export const MAX_IMPORT_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB, mirrors the backend limit

export const IMPORT_STRATEGY_OPTIONS = [
  { value: "valid_only", label: "Import Valid Only" },
  { value: "all", label: "Import All" },
];

export const DUPLICATE_HANDLING_OPTIONS = [
  { value: "skip", label: "Skip Duplicate" },
  { value: "update", label: "Update Existing" },
];

export function isAllowedImportFile(file) {
  const name = file.name.toLowerCase();
  return ALLOWED_IMPORT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function isWithinMaxImportSize(file) {
  return file.size <= MAX_IMPORT_FILE_SIZE_BYTES;
}
