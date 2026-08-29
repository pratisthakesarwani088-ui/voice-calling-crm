import { PhoneOutgoing, UploadCloud, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "./Alert.jsx";
import Spinner from "./Spinner.jsx";
import { useToast } from "../hooks/useToast.js";
import { executeImport } from "../services/importService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { ROUTES } from "../utils/constants.js";

/**
 * All three actions are now real:
 * - Add Customer -> opens the Customers page (Add Customer form lives there)
 * - Start Call -> opens the Voice Calling page
 * - Import CSV -> opens a file picker right here and imports customers
 *   immediately (reusing services/importService.js from Module 7 as-is),
 *   then calls `onImported` so the parent Dashboard can refresh its stats.
 */
function QuickActions({ onImported }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  function handleActionClick(key) {
    if (key === "add_customer") {
      navigate(ROUTES.CUSTOMERS);
      return;
    }
    if (key === "start_call") {
      navigate(ROUTES.CALLS);
      return;
    }
    if (key === "import_csv") {
      fileInputRef.current?.click();
    }
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    setImportError("");
    setIsImporting(true);
    try {
      const summary = await executeImport("customers", file, {
        strategy: "valid_only",
        duplicateHandling: "skip",
      });
      showToast(
        `Imported ${summary.imported} of ${summary.total_rows} customers.`,
        summary.imported > 0 ? "success" : "error",
      );
      onImported?.();
    } catch (error) {
      setImportError(getErrorMessage(error));
      showToast("Import Failed", "error");
    } finally {
      setIsImporting(false);
    }
  }

  const ACTIONS = [
    { key: "add_customer", label: "Add Customer", icon: UserPlus },
    { key: "start_call", label: "Start Call", icon: PhoneOutgoing },
    { key: "import_csv", label: "Import CSV", icon: UploadCloud },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            disabled={key === "import_csv" && isImporting}
            onClick={() => handleActionClick(key)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
          >
            {key === "import_csv" && isImporting ? <Spinner /> : <Icon size={16} />}
            {key === "import_csv" && isImporting ? "Importing..." : label}
          </button>
        ))}
      </div>

      {importError && (
        <div className="mt-3">
          <Alert variant="error" message={importError} />
        </div>
      )}
    </div>
  );
}

export default QuickActions;
