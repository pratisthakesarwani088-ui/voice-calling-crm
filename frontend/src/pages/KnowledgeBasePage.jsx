import { Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import KnowledgeFilters from "../components/knowledge/KnowledgeFilters.jsx";
import KnowledgeFormModal from "../components/knowledge/KnowledgeFormModal.jsx";
import KnowledgeTable from "../components/knowledge/KnowledgeTable.jsx";
import KnowledgeViewModal from "../components/knowledge/KnowledgeViewModal.jsx";
import Pagination from "../components/Pagination.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../hooks/useToast.js";
import { deleteKnowledgeEntry, listKnowledgeEntries } from "../services/knowledgeService.js";
import { listProducts } from "../services/productService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { ROUTES } from "../utils/constants.js";
import { KNOWLEDGE_PAGE_SIZE } from "../utils/knowledgeOptions.js";

const INITIAL_FILTERS = { search: "", category: "", status: "", sort: "newest" };

// Products are needed to populate the "Linked Product" dropdown and to
// show a human-readable name in the table/view modal. 100 covers any
// realistic product catalog for this dropdown-style picker; a future
// module can upgrade this to a searchable combobox if the catalog
// grows past that without changing anything else on this page.
const PRODUCT_LOOKUP_PAGE_SIZE = 100;

/**
 * Knowledge Base Management page (Module 6). Mirrors
 * pages/CustomersPage.jsx's structure and state-ownership pattern,
 * plus a products lookup for the "Linked Product" field.
 */
function KnowledgeBasePage() {
  const { showToast } = useToast();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [products, setProducts] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    listProducts({ sort: "name_asc", page: 1, page_size: PRODUCT_LOOKUP_PAGE_SIZE })
      .then((data) => setProducts(data.items))
      .catch(() => setProducts([]));
  }, []);

  const productNameById = useMemo(() => {
    const map = {};
    for (const product of products) {
      map[product.id] = `${product.product_name} (${product.product_code})`;
    }
    return map;
  }, [products]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await listKnowledgeEntries({
        search: filters.search || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
        sort: filters.sort,
        page,
        page_size: KNOWLEDGE_PAGE_SIZE,
      });
      setResult(data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function openAddForm() {
    setEditingEntry(null);
    setIsFormOpen(true);
  }

  function openEditForm(entry) {
    setEditingEntry(entry);
    setIsFormOpen(true);
  }

  function handleSaved(_entry, wasEdit) {
    setIsFormOpen(false);
    setEditingEntry(null);
    showToast(wasEdit ? "Knowledge Updated" : "Knowledge Added", "success");
    fetchEntries();
  }

  function handleValidationError() {
    showToast("Validation Error", "error");
  }

  async function handleConfirmDelete() {
    if (!deletingEntry) return;
    setIsDeleting(true);
    try {
      await deleteKnowledgeEntry(deletingEntry.id);
      showToast("Knowledge Deleted", "success");
      setDeletingEntry(null);
      if (result.items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchEntries();
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-500">
            Product Q&amp;A entries — {result.total} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`${ROUTES.IMPORT}?type=knowledge-base`}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload size={16} />
            Import
          </Link>
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Knowledge
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <KnowledgeFilters filters={filters} onChange={handleFiltersChange} />
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
            Loading knowledge base...
          </div>
        ) : (
          !loadError && (
            <>
              <KnowledgeTable
                entries={result.items}
                productNameById={productNameById}
                onView={setViewingEntry}
                onEdit={openEditForm}
                onDelete={setDeletingEntry}
                onAddEntry={openAddForm}
              />
              <Pagination
                page={result.page || page}
                totalPages={result.total_pages || 0}
                total={result.total || 0}
                pageSize={KNOWLEDGE_PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </div>

      <KnowledgeFormModal
        isOpen={isFormOpen}
        entry={editingEntry}
        products={products}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        onValidationError={handleValidationError}
      />

      <KnowledgeViewModal
        isOpen={Boolean(viewingEntry)}
        entry={viewingEntry}
        productName={viewingEntry ? productNameById[viewingEntry.product_id] : null}
        onClose={() => setViewingEntry(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingEntry)}
        title="Delete Knowledge Entry"
        message={
          deletingEntry &&
          `Are you sure you want to delete "${deletingEntry.title}"? This will remove it from all lists, but its record is kept for history.`
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEntry(null)}
      />
    </div>
  );
}

export default KnowledgeBasePage;
