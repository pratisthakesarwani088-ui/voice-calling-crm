import { useEffect, useState } from "react";

import Alert from "../Alert.jsx";
import Modal from "../Modal.jsx";
import Spinner from "../Spinner.jsx";
import { createCustomer, updateCustomer } from "../../services/customerService.js";
import { getErrorMessage } from "../../utils/apiErrors.js";
import { CUSTOMER_STATUS_OPTIONS } from "../../utils/customerOptions.js";
import { isValidEmail, isValidPhone } from "../../utils/validators.js";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  company: "",
  city: "",
  state: "",
  country: "",
  notes: "",
  status: "active",
};

function customerToForm(customer) {
  return {
    fullName: customer.full_name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    company: customer.company || "",
    city: customer.city || "",
    state: customer.state || "",
    country: customer.country || "",
    notes: customer.notes || "",
    status: customer.status || "active",
  };
}

const TEXT_FIELDS = [
  { name: "company", label: "Company" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "country", label: "Country" },
];

/**
 * Add/Edit Customer form, in one component. `customer` present = edit
 * mode (PUT); absent = create mode (POST) — both share the same fields
 * and the same validation, per the Module 5 spec ("Edit Customer...
 * Reuse validation").
 */
function CustomerFormModal({
  isOpen,
  customer,
  onClose,
  onSaved,
  onDuplicatePhone,
  onValidationError,
}) {
  const isEditMode = Boolean(customer);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(customer ? customerToForm(customer) : EMPTY_FORM);
      setFieldErrors({});
      setFormError("");
    }
    // Only reset when the modal opens/target customer changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Customer name is required.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!isValidPhone(form.phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      errors.email = "Enter a valid email address.";
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
        ? await updateCustomer(customer.id, form)
        : await createCustomer(form);
      onSaved(saved, isEditMode);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, phone: "This phone number is already in use." }));
        onDuplicatePhone();
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Customer" : "Add Customer"}
      maxWidthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={updateField("fullName")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.fullName ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={updateField("phone")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.phone ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.email ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {TEXT_FIELDS.map(({ name, label }) => (
            <div key={name}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="text"
                value={form[name]}
                onChange={updateField(name)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CUSTOMER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={updateField("notes")}
              rows={3}
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

export default CustomerFormModal;
