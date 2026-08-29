import { Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import ProductFilters from "../components/products/ProductFilters.jsx";
import ProductFormModal from "../components/products/ProductFormModal.jsx";
import ProductTable from "../components/products/ProductTable.jsx";
import ProductViewModal from "../components/products/ProductViewModal.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../hooks/useToast.js";
import { deleteProduct, listProducts } from "../services/productService.js";
import { getErrorMessage } from "../utils/apiErrors.js";
import { ROUTES } from "../utils/constants.js";
import { PRODUCTS_PAGE_SIZE } from "../utils/productOptions.js";

const INITIAL_FILTERS = { search: "", category: "", brand: "", availability: "", sort: "newest" };

/**
 * Product Management page (Module 6). Mirrors
 * pages/CustomersPage.jsx's structure and state-ownership pattern
 * exactly, adapted to Product fields/endpoints.
 */
function ProductsPage() {
  const { showToast } = useToast();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await listProducts({
        search: filters.search || undefined,
        category: filters.category || undefined,
        brand: filters.brand || undefined,
        availability: filters.availability || undefined,
        sort: filters.sort,
        page,
        page_size: PRODUCTS_PAGE_SIZE,
      });
      setResult(data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function openAddForm() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function openEditForm(product) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  function handleSaved(_product, wasEdit) {
    setIsFormOpen(false);
    setEditingProduct(null);
    showToast(wasEdit ? "Product Updated" : "Product Added", "success");
    fetchProducts();
  }

  function handleDuplicateSku() {
    showToast("Validation Error", "error");
  }

  function handleValidationError() {
    showToast("Validation Error", "error");
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      showToast("Product Deleted", "success");
      setDeletingProduct(null);
      if (result.items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchProducts();
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
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog — {result.total} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`${ROUTES.IMPORT}?type=products`}
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
            Add Product
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <ProductFilters filters={filters} onChange={handleFiltersChange} />
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
            Loading products...
          </div>
        ) : (
          !loadError && (
            <>
              <ProductTable
                products={result.items}
                onView={setViewingProduct}
                onEdit={openEditForm}
                onDelete={setDeletingProduct}
                onAddProduct={openAddForm}
              />
              <Pagination
                page={result.page || page}
                totalPages={result.total_pages || 0}
                total={result.total || 0}
                pageSize={PRODUCTS_PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        onDuplicateSku={handleDuplicateSku}
        onValidationError={handleValidationError}
      />

      <ProductViewModal
        isOpen={Boolean(viewingProduct)}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        title="Delete Product"
        message={
          deletingProduct &&
          `Are you sure you want to delete "${deletingProduct.product_name}"? This will remove it from all lists, but its record is kept for history.`
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}

export default ProductsPage;
