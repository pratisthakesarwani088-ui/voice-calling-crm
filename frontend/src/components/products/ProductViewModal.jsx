import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import Badge from "../Badge.jsx";
import Modal from "../Modal.jsx";
import { PRODUCT_AVAILABILITY_VARIANT } from "../../utils/productOptions.js";
import { ROUTES } from "../../utils/constants.js";

const DETAIL_FIELDS = [
  { key: "product_code", label: "Product Code" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand" },
  { key: "model_number", label: "Model Number" },
  { key: "sku", label: "SKU" },
  { key: "warranty", label: "Warranty" },
];

/**
 * Read-only detail view for a single product — mirrors
 * components/customers/CustomerViewModal.jsx's pattern.
 */
function ProductViewModal({ isOpen, product, onClose }) {
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Details" maxWidthClassName="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">{product.product_name}</p>
          <p className="text-sm text-gray-500">{product.product_code}</p>
        </div>
        <Badge
          label={product.availability_status.replace("_", " ")}
          variant={PRODUCT_AVAILABILITY_VARIANT[product.availability_status] || "neutral"}
          className="capitalize"
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 text-center">
        <div>
          <p className="text-xs text-gray-400">Price</p>
          <p className="text-sm font-semibold text-gray-800">${Number(product.price).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Discount</p>
          <p className="text-sm font-semibold text-gray-800">
            ${Number(product.discount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Final Price</p>
          <p className="text-sm font-semibold text-blue-600">
            ${Number(product.final_price).toFixed(2)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {DETAIL_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{product[key] || "—"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Stock Quantity
          </dt>
          <dd className="mt-0.5 text-sm text-gray-800">{product.stock_quantity}</dd>
        </div>
      </dl>

      {["description", "features", "specifications"].map((key) => (
        <div key={key} className="mt-4">
          <dt className="text-xs font-medium capitalize uppercase tracking-wide text-gray-400">
            {key}
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">
            {product[key] || "—"}
          </dd>
        </div>
      ))}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <div>Created: {new Date(product.created_at).toLocaleString()}</div>
        <div>Updated: {new Date(product.updated_at).toLocaleString()}</div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          to={`${ROUTES.AI_ASSISTANT}?productId=${product.id}`}
          className="flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Sparkles size={16} />
          Ask AI about this product
        </Link>
      </div>
    </Modal>
  );
}

export default ProductViewModal;
