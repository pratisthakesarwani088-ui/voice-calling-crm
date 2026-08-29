import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { ROUTES } from "../utils/constants.js";
import { getPasswordIssues, isValidEmail } from "../utils/validators.js";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordIssues = getPasswordIssues(form.password);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (passwordIssues.length > 0) {
      errors.password = `Password must include: ${passwordIssues.join(", ")}.`;
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccessMessage("Account created successfully. Redirecting to login...");
      setForm(INITIAL_FORM);
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 1500);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-6">
        Set up the admin account for your CRM.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={formError} />
        <Alert variant="success" message={successMessage} />

        <div>
          <label
            htmlFor="signup-full-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="signup-full-name"
            type="text"
            value={form.fullName}
            onChange={updateField("fullName")}
            autoComplete="name"
            required
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.fullName ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.fullName && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={form.email}
            onChange={updateField("email")}
            autoComplete="email"
            required
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.email ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <PasswordInput
          label="Password"
          value={form.password}
          onChange={updateField("password")}
          autoComplete="new-password"
          error={fieldErrors.password}
          hint={
            form.password && (
              <ul className="mt-1.5 space-y-0.5 text-xs">
                {[
                  { label: "At least 8 characters", met: form.password.length >= 8 },
                  { label: "One uppercase letter", met: /[A-Z]/.test(form.password) },
                  { label: "One lowercase letter", met: /[a-z]/.test(form.password) },
                  { label: "One digit", met: /\d/.test(form.password) },
                  {
                    label: "One special character",
                    met: /[^\w\s]/.test(form.password),
                  },
                ].map((rule) => (
                  <li
                    key={rule.label}
                    className={rule.met ? "text-green-600" : "text-gray-400"}
                  >
                    {rule.met ? "✓" : "○"} {rule.label}
                  </li>
                ))}
              </ul>
            )
          }
        />

        <PasswordInput
          label="Confirm password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default SignupPage;
