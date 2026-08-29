/**
 * A single metric card for the dashboard's top stat row (Total
 * Customers, Products, etc.). `value` is displayed as-is — Module 4
 * always passes 0 as a placeholder; a future module swaps in a real
 * number from the API without changing this component.
 */
function StatCard({ label, value, icon: Icon, accentClassName = "bg-blue-50 text-blue-600" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClassName}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default StatCard;
