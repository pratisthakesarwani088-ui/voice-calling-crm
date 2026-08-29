# AI Assistant - Gemini Integration - Module 8

## Overview

A Gemini-powered AI Assistant that answers questions grounded
*entirely* in this CRM's own database - a product's details, its
Knowledge Base entries, and (optionally) a customer's details. No RAG,
no embeddings, no vector database: "grounding" here means reading the
relevant rows directly and putting them in the prompt as plain text,
then instructing the model to answer only from that context.

## Architecture - two layers, deliberately separated

```
app/services/ai_service.py          <- low-level, reusable
    generate_ai_response(prompt, system_instruction) -> str
    The ONLY place that talks to the Gemini API. Knows nothing about
    Customers/Products/the CRM at all - it's a generic "text in, text
    out" function.

app/services/ai_context_service.py  <- CRM-specific
    answer_question(db, question, product_id, customer_id) -> AIAnswerResult
    Reads Product/Customer/Knowledge Base data (reusing Module 5/6's
    existing get_product_by_id / get_customer_by_id /
    list_knowledge_entries unchanged), formats it as text, and calls
    ai_service.generate_ai_response().
```

This split is what "modular and reusable for future Voice Calling
integration" means concretely: a future Voice Calling module can call
`generate_ai_response()` directly with a live conversation turn and a
different system instruction - it never needs to touch or duplicate
the CRM context-building logic, and `ai_context_service.py` never
needs to know anything changed.

## Why no RAG/embeddings

The spec is explicit that none should be used. Given the Knowledge
Base's actual size in this project (per-product, admin-curated
entries - not a large open corpus), the simplest correct approach is
to include every *published* Knowledge Base entry for the selected
product directly in the prompt (capped at `MAX_KNOWLEDGE_ENTRIES = 15`
in `ai_context_service.py`) and let Gemini itself determine what's
relevant to the question. This is standard practice for small, bounded
context sets and requires no additional infrastructure.

## Error handling

`ai_service.generate_ai_response()` never lets a raw exception escape -
every failure mode maps to one of three custom exceptions
(`app/utils/exceptions.py`), which the route then maps to an HTTP status:

| Situation | Exception | HTTP status |
|---|---|---|
| `GEMINI_API_KEY` not set | `AIConfigurationError` | 503 |
| Gemini rejects the API key (401/403) | `AIConfigurationError` | 503 |
| Request exceeds `GEMINI_TIMEOUT_SECONDS` | `AITimeoutError` | 504 |
| Network error (DNS, connection refused) | `AIServiceError` | 502 |
| Gemini returns 4xx/5xx (other than auth) | `AIServiceError` | 502 |
| Gemini rate-limits (429) | `AIServiceError` | 502 |
| Response blocked by safety filters | `AIServiceError` | 502 |
| Response has no usable text | `AIServiceError` | 502 |
| `product_id` / `customer_id` don't exist | `ProductNotFoundError` / `CustomerNotFoundError` (reused from Module 5/6) | 404 |

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Get one from https://aistudio.google.com/apikey. Left blank in dev, endpoints fail gracefully rather than the app crashing on startup. |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Model name |
| `GEMINI_API_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` | Gemini REST base URL |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Request timeout |
| `GEMINI_MAX_OUTPUT_TOKENS` | `1024` | Output length cap |
| `GEMINI_TEMPERATURE` | `0.4` | Generation temperature |

None of these are hardcoded anywhere in the code - all read via
`app/config/settings.py`, same pattern as every other module's config.

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/ai/ask` | JWT required |

**Request:**
```json
{ "question": "Is this in stock and what's the warranty?", "product_id": 3, "customer_id": null }
```

**Response:**
```json
{
  "answer": "Yes, it's currently in stock (42 units). The warranty is 1 Year.",
  "product": { "id": 3, "product_name": "Wireless Mouse", "...": "..." },
  "customer": null,
  "knowledge_sources": [{ "id": 7, "title": "Battery life", "category": "Specifications" }]
}
```

## Frontend

- `pages/AIAssistantPage.jsx` - product picker (required) + customer picker
  (optional) + question + answer display with source badges
- `services/aiService.js` - the one API call
- Entry point: an **"Ask AI about this product"** button added to
  `components/products/ProductViewModal.jsx`, linking to
  `/ai-assistant?productId=<id>`
- The Sidebar/Navbar are untouched (verified by file hash) - same
  "reachable without a new sidebar entry" pattern Module 7 established
  for the Import Center

## Manual testing steps

**Backend (curl)** - replace `<token>` with a value from `POST /auth/login`:
```bash
BASE=http://localhost:8000/api/v1

# Without GEMINI_API_KEY set - expect 503
curl -X POST $BASE/ai/ask -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Is this in stock?","product_id":1}'

# With a valid key configured and a real product id
curl -X POST $BASE/ai/ask -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the warranty and is it in stock?","product_id":1}'

# With a customer for extra context
curl -X POST $BASE/ai/ask -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Would this suit this customer?","product_id":1,"customer_id":1}'

# Nonexistent product - expect 404
curl -X POST $BASE/ai/ask -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"test","product_id":999999}'

# No token - expect 401
curl -X POST $BASE/ai/ask -H "Content-Type: application/json" \
  -d '{"question":"test","product_id":1}'
```

**Frontend**
1. Open a product's View modal (Products page) then click "Ask AI about this product" - lands on `/ai-assistant` with that product pre-selected.
2. Ask a question - see a loading state, then the answer with the product badge and any knowledge-source badges shown.
3. Optionally select a customer, ask again - the customer badge appears alongside the product badge in the result.
4. Leave the question blank and submit - inline validation error, no API call made.
5. With `GEMINI_API_KEY` unset on the backend - submit - see a clear "AI features are not configured" error, not a raw stack trace.
6. Dashboard - System Status card - "Gemini" now shows "Active" (was "Coming Soon" in Module 4/6/7).
7. Confirm Customers/Products/Knowledge Base/Import pages still work exactly as before - nothing in Modules 1-7 broke.
8. Resize through mobile/tablet/laptop/desktop - the form and answer card reflow correctly at every width.
