import { useId, useState } from "react";

/**
 * A labeled password field with a show/hide toggle, reused by both the
 * login and signup forms. `hint` can render below the field (e.g. a
 * live password-strength checklist on the signup form).
 */
function PasswordInput({ label, value, onChange, autoComplete, hint, error }) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className={`w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-500 hover:text-gray-700"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {hint}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default PasswordInput;
