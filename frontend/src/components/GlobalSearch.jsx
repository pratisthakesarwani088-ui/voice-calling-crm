import { BookOpen, Boxes, Search, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listCustomers } from "../services/customerService.js";
import { listKnowledgeEntries } from "../services/knowledgeService.js";
import { listProducts } from "../services/productService.js";
import { ROUTES } from "../utils/constants.js";

const DEBOUNCE_MS = 350;
const RESULTS_PER_GROUP = 4;

/**
 * Same input the placeholder always looked like - now enabled and
 * wired to a debounced search across the three existing list endpoints
 * (Customers/Products/Knowledge Base), each of which already supports
 * a `search` param (see Module 5/6's list services). No new backend
 * work: this is pure frontend reuse.
 */
function GlobalSearch() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({ customers: [], products: [], knowledge: [] });

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ customers: [], products: [], knowledge: [] });
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const [customerData, productData, knowledgeData] = await Promise.all([
          listCustomers({ search: trimmed, page: 1, page_size: RESULTS_PER_GROUP }),
          listProducts({ search: trimmed, page: 1, page_size: RESULTS_PER_GROUP }),
          listKnowledgeEntries({ search: trimmed, page: 1, page_size: RESULTS_PER_GROUP }),
        ]);
        setResults({
          customers: customerData.items,
          products: productData.items,
          knowledge: knowledgeData.items,
        });
      } catch {
        setResults({ customers: [], products: [], knowledge: [] });
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const hasResults =
    results.customers.length > 0 || results.products.length > 0 || results.knowledge.length > 0;
  const showDropdown = isOpen && query.trim().length >= 2;

  function goTo(path) {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  }

  return (
    <div className="relative hidden max-w-sm sm:block" ref={wrapperRef}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search customers, products, knowledge base..."
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
          {isLoading && <p className="px-4 py-2 text-sm text-gray-400">Searching...</p>}

          {!isLoading && !hasResults && (
            <p className="px-4 py-2 text-sm text-gray-400">No results found.</p>
          )}

          {!isLoading && results.customers.length > 0 && (
            <div className="mb-1">
              <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                Customers
              </p>
              {results.customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => goTo(ROUTES.CUSTOMERS)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Users size={14} className="shrink-0 text-blue-500" />
                  <span className="truncate">{customer.full_name}</span>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">{customer.phone}</span>
                </button>
              ))}
            </div>
          )}

          {!isLoading && results.products.length > 0 && (
            <div className="mb-1">
              <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                Products
              </p>
              {results.products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goTo(ROUTES.PRODUCTS)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Boxes size={14} className="shrink-0 text-purple-500" />
                  <span className="truncate">{product.product_name}</span>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                    {product.product_code}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!isLoading && results.knowledge.length > 0 && (
            <div>
              <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                Knowledge Base
              </p>
              {results.knowledge.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => goTo(ROUTES.KNOWLEDGE_BASE)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <BookOpen size={14} className="shrink-0 text-amber-500" />
                  <span className="truncate">{entry.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
