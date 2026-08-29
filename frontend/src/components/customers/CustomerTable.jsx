import { UserPlus } from "lucide-react";

import ActionButtons from "../ActionButtons.jsx";
import Badge from "../Badge.jsx";
import { CUSTOMER_STATUS_VARIANT } from "../../utils/customerOptions.js";

/**
 * Customer Management table. Columns match the Module 5 spec exactly;
 * the Action column reuses ActionButtons (built in Module 4) with real
 * handlers now wired up — View/Edit/Delete are fully functional here,
 * and Call shows the "Module 9" placeholder message, satisfying "design
 * this button so future modules can connect Demo Call / Real Call
 * without redesigning the UI": only the onCall handler changes later.
 */
function CustomerTable({ customers, onView, onEdit, onDelete, onCall, onAddCustomer }) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <UserPlus size={22} />
        </span>
        <p className="text-sm font-medium text-gray-500">No customers found.</p>
        <button
          type="button"
          onClick={onAddCustomer}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3 font-medium">Customer Code</th>
            <th className="px-5 py-3 font-medium">Customer Name</th>
            <th className="px-5 py-3 font-medium">Phone Number</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Company</th>
            <th className="px-5 py-3 font-medium">City</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Created Date</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-5 py-3.5 font-medium text-gray-900">
                {customer.customer_code}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-800">
                {customer.full_name}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{customer.phone}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {customer.email || "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {customer.company || "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {customer.city || "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <Badge
                  label={customer.status}
                  variant={CUSTOMER_STATUS_VARIANT[customer.status] || "neutral"}
                  className="capitalize"
                />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {new Date(customer.created_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <ActionButtons
                  onView={() => onView(customer)}
                  onEdit={() => onEdit(customer)}
                  onDelete={() => onDelete(customer)}
                  onCall={() => onCall(customer)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerTable;
