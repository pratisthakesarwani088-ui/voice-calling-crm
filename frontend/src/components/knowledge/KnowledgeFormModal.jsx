import { useEffect, useState } from "react";

import Alert from "../Alert.jsx";
import Modal from "../Modal.jsx";
import Spinner from "../Spinner.jsx";
import { createKnowledgeEntry, updateKnowledgeEntry } from "../../services/knowledgeService.js";
import { getErrorMessage } from "../../utils/apiErrors.js";
import { KNOWLEDGE_PRIORITY_OPTIONS, KNOWLEDGE_STATUS_OPTIONS } from "../../utils/knowledgeOptions.js";
import { validateRequiredText } from "../../utils/validators.js";

const EMPTY_FORM = {
  productId: "",
  title: "",
  question: "",
  answer: "",
  keywords: "",
  category: "",
  priority: "medium",
  status: "draft",
};

function entryToForm(entry) {
  return {
    productId: String(entry.product_id || ""),
    title: entry.title || "",
    question: entry.question || "",
    answer: entry.answer || "",
    keywords: (entry.keywords || []).join(", "),
    category: entry.category || "",
    priority: entry.priority || "medium",
    status: entry.status || "draft",
  };
}

/**
 * Add/Edit Knowledge Base entry form — mirrors
 * components/customers/CustomerFormModal.jsx's pattern. `products` is
 * the list of available products (fetched once by the parent page) to
 * populate the "Linked Product" dropdown.
 */
function KnowledgeFormModal({
  isOpen,
  entry,
  products,
  onClose,
  onSaved,
  onValidationError,
}) {
  const isEditMode = Boolean(entry);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(entry ? entryToForm(entry) : EMPTY_FORM);
      setFieldErrors({});
      setFormError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry]);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const errors = {};

    if (!form.productId) {
      errors.productId = "Please select a linked product.";
    }
    if (!validateRequiredText(form.title)) {
      errors.title = "Title is required.";
    }
    if (!validateRequiredText(form.question)) {
      errors.question = "Question is required.";
    }
    if (!validateRequiredText(form.answer)) {
      errors.answer = "Answer is required.";
    }
    if (!validateRequiredText(form.category)) {
      errors.category = "Category is required.";
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
        ? await updateKnowledgeEntry(entry.id, form)
        : await createKnowledgeEntry(form);
      onSaved(saved, isEditMode);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 422 || status === 404) {
        setFormError(getErrorMessage(error));
        onValidationError();
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Knowledge" : "Add Knowledge"}
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Linked Product</label>
            <select
              value={form.productId}
              onChange={updateField("productId")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.productId ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Select a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.product_name} ({product.product_code})
                </option>
              ))}
            </select>
            {fieldErrors.productId && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.productId}</p>
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

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={updateField("title")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.title ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
            <textarea
              value={form.question}
              onChange={updateField("question")}
              rows={2}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.question ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.question && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.question}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Answer</label>
            <textarea
              value={form.answer}
              onChange={updateField("answer")}
              rows={4}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.answer ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.answer && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.answer}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Keywords
              <span className="ml-1 font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={updateField("keywords")}
              placeholder="e.g. warranty, return policy, shipping"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={form.priority}
              onChange={updateField("priority")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {KNOWLEDGE_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {KNOWLEDGE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

export default KnowledgeFormModal;
