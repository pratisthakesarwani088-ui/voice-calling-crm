import { History } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Alert from "../components/Alert.jsx";
import CallDetailsModal from "../components/calls/CallDetailsModal.jsx";
import CallHistoryFilters from "../components/calls/CallHistoryFilters.jsx";
import CallHistoryTable from "../components/calls/CallHistoryTable.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../hooks/useToast.js";
import { deleteCall, listCalls } from "../services/callService.js";
import { getErrorMessage } from "../utils/apiErrors.js";

const INITIAL_FILTERS = { search: "", mode: "", status: "", dateFrom: "", dateTo: "" };
const PAGE_SIZE = 10;

/**
 * Call History page (Module 10). Mirrors pages/CustomersPage.jsx's
 * structure and state-ownership pattern exactly, adapted to Call
 * fields/endpoints - search/filter/paginate/view/delete, reusing the
 * same generic Modal/ConfirmDialog/Pagination/ActionButtons/Badge
 * primitives every other list page in this project uses.
 */
function CallHistoryPage() {
  const { showToast } = useToast();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [viewingCall, setViewingCall] = useState(null);
  const [deletingCall, setDeletingCall] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await listCalls({
        search: filters.search || undefined,
        mode: filters.mode || undefined,
        status: filters.status || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        sort: "newest",
        page,
        page_size: PAGE_SIZE,
      });
      setResult(data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!deletingCall) return;
    setIsDeleting(true);
    try {
      await deleteCall(deletingCall.id);
      showToast("Call Deleted", "success");
      setDeletingCall(null);
      if (result.items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchCalls();
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          <History size={22} className="text-blue-600" />
          Call History
        </h1>
        <p className="mt-1 text-sm text-gray-500">Every Demo and Real call — {result.total} total.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <CallHistoryFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {loadError && (
          <div className="p-5">
            <Alert variant="error" message={loadError} />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Spinner className="h-5 w-5" />
            Loading call history...
          </div>
        ) : (
          !loadError && (
            <>
              <CallHistoryTable
                calls={result.items}
                onView={setViewingCall}
                onDelete={setDeletingCall}
                isLoading={isLoading}
              />
              <Pagination
                page={result.page || page}
                totalPages={result.total_pages || 0}
                total={result.total || 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </div>

      <CallDetailsModal
        isOpen={Boolean(viewingCall)}
        call={viewingCall}
        onClose={() => setViewingCall(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCall)}
        title="Delete Call"
        message={
          deletingCall &&
          `Are you sure you want to delete this call with "${deletingCall.customer_name}"? Its record is kept for history but will no longer appear in Call History.`
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCall(null)}
      />
    </div>
  );
}

export default CallHistoryPage;
