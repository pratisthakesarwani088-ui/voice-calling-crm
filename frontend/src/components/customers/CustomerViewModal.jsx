import Badge from "../Badge.jsx";
import Modal from "../Modal.jsx";
import { CUSTOMER_STATUS_VARIANT } from "../../utils/customerOptions.js";

const DETAIL_FIELDS = [
  { key: "customer_code", label: "Customer Code" },
  { key: "full_name", label: "Customer Name" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
];

/**
 * Read-only detail view for a single customer. Fetches nothing itself —
 * the parent page passes the already-loaded row (from the table, or a
 * fresh GET /customers/{id}) — either way it's just data in, JSX out.
 */
function CustomerViewModal({ isOpen, customer, onClose }) {
  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" maxWidthClassName="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">{customer.full_name}</p>
          <p className="text-sm text-gray-500">{customer.customer_code}</p>
        </div>
        <Badge
          label={customer.status}
          variant={CUSTOMER_STATUS_VARIANT[customer.status] || "neutral"}
          className="capitalize"
        />
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {DETAIL_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">{customer[key] || "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</dt>
        <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">
          {customer.notes || "—"}
        </dd>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <div>Created: {new Date(customer.created_at).toLocaleString()}</div>
        <div>Updated: {new Date(customer.updated_at).toLocaleString()}</div>
      </div>
    </Modal>
  );
}

export default CustomerViewModal;
