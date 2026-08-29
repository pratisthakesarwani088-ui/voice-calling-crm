import { CheckCircle2, LogOut, Settings as SettingsIcon, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import Alert from "../components/Alert.jsx";
import Badge from "../components/Badge.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import {
  changePassword,
  getSettings,
  testAI,
  testTelephony,
  testVoice,
  updateSettings,
} from "../services/settingsService.js";

const TABS = ["Company", "AI", "Voice", "Telephony", "Profile", "Security"];

const INPUT_CLASS =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL_CLASS = "mb-1 block text-sm font-medium text-gray-700";

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function TestResultBanner({ result }) {
  if (!result) return null;
  const Icon = result.success ? CheckCircle2 : XCircle;
  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        result.success
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <Icon size={16} />
      {result.message}
    </div>
  );
}

/**
 * Settings page (Module 11). Six sections in one page with tabs, reusing
 * existing form/Alert/Spinner/Badge/PasswordInput components rather than
 * introducing new ones. Company/AI/Voice/Telephony are saved together via
 * a single PUT (a partial update — see backend/app/schemas/settings.py);
 * Change Password and Logout use existing Module 3 infrastructure as-is.
 */
function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("Company");
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [testResults, setTestResults] = useState({});
  const [testingKey, setTestingKey] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordFormError, setPasswordFormError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setForm(data);
        setSavedForm(data);
      })
      .catch((error) => setLoadError(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  function updateField(field) {
    return (value) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await updateSettings(form);
      setForm(saved);
      setSavedForm(saved);
      showToast("Settings Saved", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setForm(savedForm);
    setTestResults({});
  }

  async function runTest(key, testFn, payload) {
    setTestingKey(key);
    try {
      const result = await testFn(payload);
      setTestResults((prev) => ({ ...prev, [key]: result }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { success: false, message: getErrorMessage(error) },
      }));
    } finally {
      setTestingKey("");
    }
  }

  function validatePasswordForm() {
    const errors = {};
    if (!passwordForm.current_password) errors.current_password = "Current password is required.";
    if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
      errors.new_password = "New password must be at least 8 characters.";
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match.";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setPasswordFormError("");
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm);
      showToast("Password Changed", "success");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      setPasswordFormError(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Spinner className="h-5 w-5" />
        Loading settings...
      </div>
    );
  }

  if (loadError || !form) {
    return <Alert variant="error" message={loadError || "Could not load settings."} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          <SettingsIcon size={22} className="text-blue-600" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Company, AI, Voice, Telephony, Profile, and Security configuration.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === tab ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {activeTab === "Company" && (
          <div className="space-y-4">
            <Field
              label="Company Name"
              value={form.company_name}
              onChange={updateField("company_name")}
            />
            <Field
              label="Logo URL"
              value={form.company_logo_url}
              onChange={updateField("company_logo_url")}
              placeholder="https://..."
            />
            <Field
              label="Time Zone"
              value={form.timezone}
              onChange={updateField("timezone")}
              placeholder="UTC"
            />
          </div>
        )}

        {activeTab === "AI" && (
          <div className="space-y-4">
            <Field
              label="Gemini API Key"
              value={form.gemini_api_key}
              onChange={updateField("gemini_api_key")}
              placeholder="AIza..."
            />
            <Field
              label="Gemini Model"
              value={form.gemini_model}
              onChange={updateField("gemini_model")}
              placeholder="gemini-1.5-flash"
            />
            <button
              type="button"
              disabled={testingKey === "ai"}
              onClick={() =>
                runTest("ai", testAI, {
                  gemini_api_key: form.gemini_api_key,
                  gemini_model: form.gemini_model,
                })
              }
              className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {testingKey === "ai" && <Spinner />}
              Test AI
            </button>
            <TestResultBanner result={testResults.ai} />
          </div>
        )}

        {activeTab === "Voice" && (
          <div className="space-y-4">
            <Field
              label="Vapi API Key"
              value={form.vapi_api_key}
              onChange={updateField("vapi_api_key")}
            />
            <Field
              label="Vapi Assistant ID"
              value={form.vapi_assistant_id}
              onChange={updateField("vapi_assistant_id")}
            />
            <Field
              label="ElevenLabs API Key"
              value={form.elevenlabs_api_key}
              onChange={updateField("elevenlabs_api_key")}
            />
            <Field
              label="ElevenLabs Voice ID"
              value={form.elevenlabs_voice_id}
              onChange={updateField("elevenlabs_voice_id")}
            />
            <button
              type="button"
              disabled={testingKey === "voice"}
              onClick={() =>
                runTest("voice", testVoice, {
                  vapi_api_key: form.vapi_api_key,
                  elevenlabs_api_key: form.elevenlabs_api_key,
                  elevenlabs_voice_id: form.elevenlabs_voice_id,
                })
              }
              className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {testingKey === "voice" && <Spinner />}
              Test Voice
            </button>
            <TestResultBanner result={testResults.voice} />
          </div>
        )}

        {activeTab === "Telephony" && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Telephony Provider</label>
              <select
                value={form.telephony_provider}
                onChange={(event) => updateField("telephony_provider")(event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="twilio">Twilio</option>
                <option value="exotel">Exotel</option>
              </select>
            </div>
            <Field
              label="Account ID"
              value={form.telephony_account_id}
              onChange={updateField("telephony_account_id")}
            />
            <Field
              label="Auth Token"
              value={form.telephony_auth_token}
              onChange={updateField("telephony_auth_token")}
            />
            <Field
              label="Caller Number"
              value={form.telephony_caller_number}
              onChange={updateField("telephony_caller_number")}
              placeholder="+1..."
            />
            <button
              type="button"
              disabled={testingKey === "telephony"}
              onClick={() =>
                runTest("telephony", testTelephony, {
                  telephony_provider: form.telephony_provider,
                  telephony_account_id: form.telephony_account_id,
                  telephony_auth_token: form.telephony_auth_token,
                })
              }
              className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {testingKey === "telephony" && <Spinner />}
              Test Telephony
            </button>
            <TestResultBanner result={testResults.telephony} />
          </div>
        )}

        {activeTab === "Profile" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Full Name
              </p>
              <p className="text-sm text-gray-800">{user?.full_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</p>
              <p className="text-sm text-gray-800">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</p>
              <Badge label={user?.role} variant="info" className="mt-1 capitalize" />
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="space-y-6">
            <form onSubmit={handleChangePassword} noValidate className="space-y-4">
              <Alert variant="error" message={passwordFormError} />
              <PasswordInput
                label="Current Password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))
                }
                autoComplete="current-password"
                error={passwordErrors.current_password}
              />
              <PasswordInput
                label="New Password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))
                }
                autoComplete="new-password"
                error={passwordErrors.new_password}
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))
                }
                autoComplete="new-password"
                error={passwordErrors.confirm_password}
              />
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isChangingPassword && <Spinner />}
                Change Password
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}

        {["Company", "AI", "Voice", "Telephony"].includes(activeTab) && (
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving && <Spinner />}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
