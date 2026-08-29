const VARIANT_STYLES = {
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-green-50 text-green-700 border-green-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

/**
 * Small banner for success/error messages, shared by the login and
 * signup forms (and reusable by any future form).
 */
function Alert({ variant = "error", message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-md border px-3 py-2 text-sm ${VARIANT_STYLES[variant]}`}
    >
      {message}
    </div>
  );
}

export default Alert;
