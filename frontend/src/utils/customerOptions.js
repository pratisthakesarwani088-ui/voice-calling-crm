/**
 * Shared, non-secret config for Customer Management — status/sort
 * dropdown options and the fixed page size. Defined once so the Add
 * form, Edit form, and filter bar all read from the same list instead
 * of repeating option strings.
 */

// Matches backend/app/models/enums.py:CustomerStatus values exactly.
export const CUSTOMER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
];

export const CUSTOMER_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Customer Name A-Z" },
  { value: "name_desc", label: "Customer Name Z-A" },
];

// Maps a customer status value to the Badge variant used in the table
// and view modal, so both agree on the same color coding (mirrors the
// CALL_STATUS_VARIANT pattern from Module 4's dashboardData.js).
export const CUSTOMER_STATUS_VARIANT = {
  active: "success",
  inactive: "neutral",
  blocked: "danger",
};

// Matches backend/app/schemas/customer.py:CUSTOMERS_DEFAULT_PAGE_SIZE —
// fixed per the Module 5 spec ("10 customers per page"), not a user
// setting.
export const CUSTOMERS_PAGE_SIZE = 10;
