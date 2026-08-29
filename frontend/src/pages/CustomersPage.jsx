import { Download, Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CustomerFilters from "../components/customers/CustomerFilters.jsx";
import CustomerFormModal from "../components/customers/CustomerFormModal.jsx";
import CustomerTable from "../components/customers/CustomerTable.jsx";
import CustomerViewModal from "../components/customers/CustomerViewModal.jsx";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import Spinner from "../components/Spinner.jsx";
import { deleteCustomer, exportCustomers, listCustomers } from "../services/customerService.js";
import { useToast } from "../hooks/useToast.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { CUSTOMERS_PAGE_SIZE } from "../utils/customerOptions.js";
import { ROUTES } from "../utils/constants.js";

const INITIAL_FILTERS = { search: "", status: "", city: "", state: "", sort: "newest" };

/**
 * Customer Management page (Module 5). Owns all customer-list state
 * (filters, page, results) and orchestrates the Add/Edit/View modals
 * and the delete confirmation — the table and filter bar themselves
 * are presentational and reusable.
 */
function CustomersPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await listCustomers({
        search: filters.search || undefined,
        status: filters.status || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        sort: filters.sort,
        page,
        page_size: CUSTOMERS_PAGE_SIZE,
      });
      setResult(data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Any filter change resets back to page 1 — staying on e.g. page 3 of
  // a now-narrower result set would just show an empty page.
  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function openAddForm() {
    setEditingCustomer(null);
    setIsFormOpen(true);
  }

  function openEditForm(customer) {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }

  function handleSaved(_customer, wasEdit) {
    setIsFormOpen(false);
    setEditingCustomer(null);
    showToast(wasEdit ? "Customer Updated" : "Customer Added", "success");
    fetchCustomers();
  }

  function handleDuplicatePhone() {
    showToast("Duplicate Phone Number", "error");
  }

  function handleValidationError() {
    showToast("Validation Error", "error");
  }

  async function handleConfirmDelete() {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(deletingCustomer.id);
      showToast("Customer Deleted", "success");
      setDeletingCustomer(null);
      // A delete can empty out the last item on the current page —
      // step back a page rather than show a stale, now-empty page.
      if (result.items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchCustomers();
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCall(customer) {
    navigate(`${ROUTES.CALLS}?customerId=${customer.id}`);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportCustomers({
        search: filters.search || undefined,
        status: filters.status || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        sort: filters.sort,
      });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer records — {result.total} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`${ROUTES.IMPORT}?type=customers`}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload size={16} />
            Import
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {isExporting ? <Spinner /> : <Download size={16} />}
            Export
          </button>
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <CustomerFilters filters={filters} onChange={handleFiltersChange} />
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
            Loading customers...
          </div>
        ) : (
          !loadError && (
            <>
              <CustomerTable
                customers={result.items}
                onView={setViewingCustomer}
                onEdit={openEditForm}
                onDelete={setDeletingCustomer}
                onCall={handleCall}
                onAddCustomer={openAddForm}
              />
              <Pagination
                page={result.page || page}
                totalPages={result.total_pages || 0}
                total={result.total || 0}
                pageSize={CUSTOMERS_PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </div>

      <CustomerFormModal
        isOpen={isFormOpen}
        customer={editingCustomer}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        onDuplicatePhone={handleDuplicatePhone}
        onValidationError={handleValidationError}
      />

      <CustomerViewModal
        isOpen={Boolean(viewingCustomer)}
        customer={viewingCustomer}
        onClose={() => setViewingCustomer(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        title="Delete Customer"
        message={
          deletingCustomer &&
          `Are you sure you want to delete "${deletingCustomer.full_name}"? This will remove them from all lists, but their record is kept for history.`
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}

export default CustomersPage;
