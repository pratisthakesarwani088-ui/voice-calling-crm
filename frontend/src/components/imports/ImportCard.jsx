import { FileSpreadsheet, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";

import Alert from "../Alert.jsx";
import Spinner from "../Spinner.jsx";
import { downloadTemplate, executeImport, previewImport } from "../../services/importService.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/apiErrors.js";
import {
  DUPLICATE_HANDLING_OPTIONS,
  IMPORT_STRATEGY_OPTIONS,
  isAllowedImportFile,
  isWithinMaxImportSize,
} from "../../utils/importOptions.js";
import ImportPreviewTable from "./ImportPreviewTable.jsx";
import ImportProgressBar from "./ImportProgressBar.jsx";
import ImportSummaryPanel from "./ImportSummaryPanel.jsx";

/**
 * One entity's full import flow, self-contained: file select -> client-
 * side validation -> server preview -> options -> import with progress
 * -> summary. `entityKey` is the backend's URL key ("customers", etc.);
 * `label` is the display name.
 *
 * Phase machine: idle -> selected -> previewed -> importing -> completed
 * (any phase can Cancel back to idle).
 */
function ImportCard({ entityKey, label, description }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [phase, setPhase] = useState("idle");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [strategy, setStrategy] = useState("valid_only");
  const [duplicateHandling, setDuplicateHandling] = useState("skip");

  const [uploadPercent, setUploadPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [importError, setImportError] = useState("");

  function reset() {
    setPhase("idle");
    setFile(null);
    setFileError("");
    setPreview(null);
    setPreviewError("");
    setUploadPercent(0);
    setIsProcessing(false);
    setSummary(null);
    setImportError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelected(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!isAllowedImportFile(selected)) {
      setFileError("Only .csv and .xlsx files are allowed.");
      showToast("Validation Error", "error");
      return;
    }
    if (!isWithinMaxImportSize(selected)) {
      setFileError("File is too large. Maximum allowed size is 50 MB.");
      showToast("Validation Error", "error");
      return;
    }

    setFile(selected);
    setFileError("");
    setPhase("selected");
  }

  async function handlePreview() {
    setIsPreviewing(true);
    setPreviewError("");
    try {
      const data = await previewImport(entityKey, file);
      setPreview(data);
      setPhase("previewed");
      if (data.missing_required_columns.length > 0) {
        showToast("Validation Error", "error");
      }
    } catch (error) {
      setPreviewError(getErrorMessage(error));
      showToast("Validation Error", "error");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    setPhase("importing");
    setImportError("");
    setUploadPercent(0);
    setIsProcessing(false);
    showToast("Import Started", "info");

    try {
      const data = await executeImport(entityKey, file, {
        strategy,
        duplicateHandling,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadPercent(percent);
          if (percent >= 100) setIsProcessing(true);
        },
      });
      setSummary(data);
      setPhase("completed");
      showToast(
        data.imported > 0 ? "Import Completed" : "Import Failed",
        data.imported > 0 ? "success" : "error",
      );
    } catch (error) {
      setImportError(getErrorMessage(error));
      setPhase("previewed"); // let them retry from the preview they already have
      showToast("Import Failed", "error");
    }
  }

  const hasMissingColumns = preview && preview.missing_required_columns.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileSpreadsheet size={20} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Import {label}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>

      {/* Template downloads — always available */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadTemplate(entityKey, "csv")}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <FileUp size={14} />
          Sample CSV
        </button>
        <button
          type="button"
          onClick={() => downloadTemplate(entityKey, "xlsx")}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <FileUp size={14} />
          Sample Excel
        </button>
      </div>

      {phase === "idle" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelected}
            className="hidden"
            id={`file-input-${entityKey}`}
          />
          <label
            htmlFor={`file-input-${entityKey}`}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8 text-center hover:border-blue-300 hover:bg-blue-50/40"
          >
            <Upload size={22} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Upload CSV or Excel</span>
            <span className="text-xs text-gray-400">.csv or .xlsx, up to 50 MB</span>
          </label>
          {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
        </div>
      )}

      {phase === "selected" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="truncate text-gray-700">{file.name}</span>
            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <Alert variant="error" message={previewError} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPreviewing && <Spinner />}
              Preview Data
            </button>
          </div>
        </div>
      )}

      {phase === "previewed" && preview && (
        <div className="space-y-4">
          {hasMissingColumns ? (
            <Alert
              variant="error"
              message={`Missing required column(s): ${preview.missing_required_columns.join(", ")}`}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Rows", value: preview.total_rows },
                  { label: "Valid", value: preview.valid_count, className: "text-green-600" },
                  { label: "Invalid", value: preview.invalid_count, className: "text-red-600" },
                  { label: "Duplicates", value: preview.duplicate_count, className: "text-amber-600" },
                ].map(({ label: statLabel, value, className }) => (
                  <div key={statLabel} className="rounded-lg bg-gray-50 p-2.5 text-center">
                    <p className={`text-lg font-semibold text-gray-800 ${className || ""}`}>{value}</p>
                    <p className="text-xs text-gray-500">{statLabel}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  Preview (first {preview.preview_rows.length} of {preview.total_rows} rows)
                </p>
                <ImportPreviewTable headers={preview.headers} rows={preview.preview_rows} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Import Option</label>
                  <select
                    value={strategy}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {IMPORT_STRATEGY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Duplicate Handling
                  </label>
                  <select
                    value={duplicateHandling}
                    onChange={(event) => setDuplicateHandling(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DUPLICATE_HANDLING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <Alert variant="error" message={importError} />

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {!hasMissingColumns && (
              <button
                type="button"
                onClick={handleImport}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {IMPORT_STRATEGY_OPTIONS.find((option) => option.value === strategy)?.label}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "importing" && (
        <ImportProgressBar
          uploadPercent={uploadPercent}
          isProcessing={isProcessing}
          imported={0}
          skipped={0}
          failed={0}
          remaining={preview?.total_rows ?? 0}
        />
      )}

      {phase === "completed" && summary && (
        <div className="space-y-4">
          {summary.failed > 0 && summary.imported === 0 && (
            <Alert variant="error" message="Import failed — no rows were imported." />
          )}
          <ImportSummaryPanel summary={summary} entityLabel={label} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportCard;
