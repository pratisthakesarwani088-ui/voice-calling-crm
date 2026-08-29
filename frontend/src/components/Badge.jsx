const VARIANT_STYLES = {
  neutral: "bg-gray-100 text-gray-600",
  info: "bg-blue-100 text-blue-700",
  progress: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
};

/**
 * Small colored pill used for statuses everywhere in the CRM — call
 * statuses (Recent Calls table, Call Status Panel), system status, and
 * any future status field. Reusing one component keeps status styling
 * consistent instead of re-implementing pill styles in every table.
 */
function Badge({ label, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${VARIANT_STYLES[variant]} ${className}`}
    >
      {label}
    </span>
  );
}

export default Badge;
