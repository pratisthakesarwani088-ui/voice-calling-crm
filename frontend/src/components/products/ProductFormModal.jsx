import { useEffect, useState } from "react";

import Alert from "../Alert.jsx";
import Modal from "../Modal.jsx";
import Spinner from "../Spinner.jsx";
import { createProduct, updateProduct } from "../../services/productService.js";
import { getErrorMessage } from "../../utils/apiErrors.js";
import { computeFinalPrice, PRODUCT_AVAILABILITY_OPTIONS } from "../../utils/productOptions.js";
import { validateRequiredText } from "../../utils/validators.js";

const EMPTY_FORM = {
  productName: "",
  category: "",
  brand: "",
  modelNumber: "",
  sku: "",
  price: "",
  discount: "",
  stockQuantity: "",
  warranty: "",
  description: "",
  features: "",
  specifications: "",
  availabilityStatus: "in_stock",
};

function productToForm(product) {
  return {
    productName: product.product_name || "",
    category: product.category || "",
    brand: product.brand || "",
    modelNumber: product.model_number || "",
    sku: product.sku || "",
    price: product.price ?? "",
    discount: product.discount ?? "",
    stockQuantity: product.stock_quantity ?? "",
    warranty: product.warranty || "",
    description: product.description || "",
    features: product.features || "",
    specifications: product.specifications || "",
    availabilityStatus: product.availability_status || "in_stock",
  };
}

const REQUIRED_TEXT_FIELDS = [
  { name: "productName", label: "Product Name" },
  { name: "category", label: "Category" },
  { name: "brand", label: "Brand" },
  { name: "sku", label: "SKU" },
];

/**
 * Add/Edit Product form, in one component — mirrors
 * components/customers/CustomerFormModal.jsx's pattern. `product`
 * present = edit mode (PUT); absent = create mode (POST).
 */
function ProductFormModal({ isOpen, product, onClose, onSaved, onDuplicateSku, onValidationError }) {
  const isEditMode = Boolean(product);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(product ? productToForm(product) : EMPTY_FORM);
      setFieldErrors({});
      setFormError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const errors = {};

    for (const { name, label } of REQUIRED_TEXT_FIELDS) {
      if (!validateRequiredText(form[name])) {
        errors[name] = `${label} is required.`;
      }
    }

    if (form.price === "" || Number(form.price) < 0) {
      errors.price = "Price is required and cannot be negative.";
    }

    if (form.discount !== "" && Number(form.discount) < 0) {
      errors.discount = "Discount cannot be negative.";
    }

    if (form.stockQuantity === "" || Number(form.stockQuantity) < 0) {
      errors.stockQuantity = "Stock quantity is required and cannot be negative.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!validate()) {
      setFormError("Please fix the highlighted fields.");
      onValidationError();
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = isEditMode
        ? await updateProduct(product.id, form)
        : await createProduct(form);
      onSaved(saved, isEditMode);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, sku: "This SKU is already in use." }));
        onDuplicateSku();
      } else if (status === 422) {
        setFormError(getErrorMessage(error));
        onValidationError();
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewFinalPrice = computeFinalPrice(form.price, form.discount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Product" : "Add Product"}
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={form.productName}
              onChange={updateField("productName")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.productName ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.productName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.productName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={updateField("category")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.category ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={updateField("brand")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.brand ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.brand && <p className="mt-1 text-xs text-red-600">{fieldErrors.brand}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model Number</label>
            <input
              type="text"
              value={form.modelNumber}
              onChange={updateField("modelNumber")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={updateField("sku")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.sku ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.sku && <p className="mt-1 text-xs text-red-600">{fieldErrors.sku}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={updateField("price")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.price ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Discount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={updateField("discount")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.discount ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.discount && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.discount}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Final Price (Auto Calculated)
            </label>
            <input
              type="text"
              readOnly
              value={`$${previewFinalPrice.toFixed(2)}`}
              className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={updateField("stockQuantity")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.stockQuantity ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.stockQuantity && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.stockQuantity}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Warranty</label>
            <input
              type="text"
              value={form.warranty}
              onChange={updateField("warranty")}
              placeholder="e.g. 1 Year"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Availability Status
            </label>
            <select
              value={form.availabilityStatus}
              onChange={updateField("availabilityStatus")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCT_AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={updateField("description")}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Features</label>
            <textarea
              value={form.features}
              onChange={updateField("features")}
              rows={2}
              placeholder="One per line"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Specifications
            </label>
            <textarea
              value={form.specifications}
              onChange={updateField("specifications")}
              rows={2}
              placeholder="e.g. Weight: 1.2kg, Color: Black"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting && <Spinner />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
