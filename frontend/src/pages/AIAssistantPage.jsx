import { Bot, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Alert from "../components/Alert.jsx";
import Badge from "../components/Badge.jsx";
import Spinner from "../components/Spinner.jsx";
import { askAI } from "../services/aiService.js";
import { listCustomers } from "../services/customerService.js";
import { listProducts } from "../services/productService.js";
import { getErrorMessage } from "../utils/apiErrors.js";

// Covers any realistic catalog/customer-base size for these dropdown
// pickers - same reasoning and same limit as Module 6's Knowledge Base
// "Linked Product" dropdown.
const LOOKUP_PAGE_SIZE = 100;

/**
 * AI Assistant (Module 8). Ask a question grounded in a product's
 * details and knowledge base - the backend builds the entire context
 * from the database (no RAG/embeddings) and sends it to Gemini. Not
 * linked from the Sidebar (per this module's scope); reachable from
 * the "Ask AI" button on a product's View modal, or by navigating here
 * directly and picking a product.
 */
function AIAssistantPage() {
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [productId, setProductId] = useState(searchParams.get("productId") || "");
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") || "");
  const [question, setQuestion] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState(null);
  const [askError, setAskError] = useState("");

  useEffect(() => {
    Promise.all([
      listProducts({ sort: "name_asc", page: 1, page_size: LOOKUP_PAGE_SIZE }),
      listCustomers({ sort: "name_asc", page: 1, page_size: LOOKUP_PAGE_SIZE }),
    ])
      .then(([productData, customerData]) => {
        setProducts(productData.items);
        setCustomers(customerData.items);
      })
      .catch(() => {
        setProducts([]);
        setCustomers([]);
      })
      .finally(() => setIsLoadingOptions(false));
  }, []);

  function validate() {
    const errors = {};
    if (!productId) errors.productId = "Select a product to ground the question in.";
    if (!question.trim() || question.trim().length < 3) {
      errors.question = "Enter a question (at least 3 characters).";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAskError("");
    setResult(null);

    if (!validate()) return;

    setIsAsking(true);
    try {
      const data = await askAI({
        question: question.trim(),
        productId,
        customerId: customerId || null,
      });
      setResult(data);
    } catch (error) {
      setAskError(getErrorMessage(error));
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
          <Sparkles size={22} className="text-blue-600" />
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask a question about a product — answers are generated only from your
          product and knowledge base data, powered by Gemini.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
              <select
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, productId: undefined }));
                }}
                disabled={isLoadingOptions}
                className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.productId ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.product_code})
                  </option>
                ))}
              </select>
              {fieldErrors.productId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.productId}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Customer <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                disabled={isLoadingOptions}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} ({customer.customer_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
            <textarea
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setFieldErrors((prev) => ({ ...prev, question: undefined }));
              }}
              rows={3}
              placeholder="e.g. What's the warranty on this product, and is it in stock?"
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.question ? "border-red-400" : "border-gray-300"
              }`}
            />
            {fieldErrors.question && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.question}</p>
            )}
          </div>

          <Alert variant="error" message={askError} />

          <button
            type="submit"
            disabled={isAsking || isLoadingOptions}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isAsking && <Spinner />}
            Ask AI
          </button>
        </form>
      </div>

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Bot size={16} />
            </span>
            <h2 className="text-sm font-semibold text-gray-900">AI Answer</h2>
          </div>

          <p className="whitespace-pre-wrap text-sm text-gray-800">{result.answer}</p>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            <Badge label={`Product: ${result.product.product_name}`} variant="info" />
            {result.customer && (
              <Badge label={`Customer: ${result.customer.full_name}`} variant="info" />
            )}
          </div>

          {result.knowledge_sources.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                Grounded in {result.knowledge_sources.length} knowledge base
                {result.knowledge_sources.length === 1 ? " entry" : " entries"}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.knowledge_sources.map((source) => (
                  <Badge key={source.id} label={source.title} variant="neutral" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIAssistantPage;
