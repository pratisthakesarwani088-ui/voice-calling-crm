import { Search } from "lucide-react";

import { CUSTOMER_SORT_OPTIONS, CUSTOMER_STATUS_OPTIONS } from "../../utils/customerOptions.js";

/**
 * Controlled filter bar — the parent page (CustomersPage) owns all the
 * state; this component is purely presentational plumbing so it's easy
 * to test/reuse independent of how the page fetches data.
 */
function CustomerFilters({ filters, onChange }) {
  function handleChange(field) {
    return (event) => onChange({ ...filters, [field]: event.target.value });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative lg:col-span-2">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={filters.search}
          onChange={handleChange("search")}
          placeholder="Search name, phone, email, company..."
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select
        value={filters.status}
        onChange={handleChange("status")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All statuses</option>
        {CUSTOMER_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={filters.city}
        onChange={handleChange("city")}
        placeholder="Filter by city"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        value={filters.state}
        onChange={handleChange("state")}
        placeholder="Filter by state"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filters.sort}
        onChange={handleChange("sort")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2 lg:col-span-1"
      >
        {CUSTOMER_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CustomerFilters;
