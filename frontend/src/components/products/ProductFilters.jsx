import { Search } from "lucide-react";

import { PRODUCT_AVAILABILITY_OPTIONS, PRODUCT_SORT_OPTIONS } from "../../utils/productOptions.js";

/**
 * Controlled filter bar — mirrors components/customers/CustomerFilters.jsx's pattern.
 */
function ProductFilters({ filters, onChange }) {
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
          placeholder="Search name, brand, category, SKU..."
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <input
        type="text"
        value={filters.category}
        onChange={handleChange("category")}
        placeholder="Filter by category"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        value={filters.brand}
        onChange={handleChange("brand")}
        placeholder="Filter by brand"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filters.availability}
        onChange={handleChange("availability")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All availability</option>
        {PRODUCT_AVAILABILITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={handleChange("sort")}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2 lg:col-span-1"
      >
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProductFilters;
