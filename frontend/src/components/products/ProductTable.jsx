import { Package } from "lucide-react";

import ActionButtons from "../ActionButtons.jsx";
import Badge from "../Badge.jsx";
import { PRODUCT_AVAILABILITY_VARIANT } from "../../utils/productOptions.js";

/**
 * Product Management table. Only View/Edit/Delete are in scope for
 * Products (no Call button) — achieved via ActionButtons'
 * `visibleActions` prop without modifying that shared component's
 * default behavior for Customers/Dashboard.
 */
function ProductTable({ products, onView, onEdit, onDelete, onAddProduct }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Package size={22} />
        </span>
        <p className="text-sm font-medium text-gray-500">No Products Found.</p>
        <button
          type="button"
          onClick={onAddProduct}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Product
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3 font-medium">Product Code</th>
            <th className="px-5 py-3 font-medium">Product Name</th>
            <th className="px-5 py-3 font-medium">Brand</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Stock</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Created Date</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                {product.product_code}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-800">
                {product.product_name}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{product.brand}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {product.category}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                ${Number(product.final_price).toFixed(2)}
                {Number(product.discount) > 0 && (
                  <span className="ml-1 text-xs text-gray-400 line-through">
                    ${Number(product.price).toFixed(2)}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {product.stock_quantity}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <Badge
                  label={product.availability_status.replace("_", " ")}
                  variant={PRODUCT_AVAILABILITY_VARIANT[product.availability_status] || "neutral"}
                  className="capitalize"
                />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {new Date(product.created_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <ActionButtons
                  visibleActions={["view", "edit", "delete"]}
                  onView={() => onView(product)}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
