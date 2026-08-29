"""
AI context-building service.

This is the "read Product, Knowledge Base, and Customer data from the
existing database" + "generate AI responses only from database data"
layer. It reuses Module 5/6/7's existing service functions unchanged
(get_product_by_id, get_customer_by_id, list_knowledge_entries) to
fetch data, formats it as plain text, and hands a grounded prompt to
the low-level app.services.ai_service.generate_ai_response().

No RAG, no embeddings, no vector search: "relevant" Knowledge Base
entries are simply every published entry linked to the given product
(bounded by MAX_KNOWLEDGE_ENTRIES) - the model itself is instructed to
pick out what's relevant from that context, which is the standard
non-RAG approach to grounding a small, bounded amount of context.

The context-formatting functions below are public (no leading
underscore) specifically so Module 9's Voice Calling service can reuse
them unchanged to ground a call's AI assistant in the same way this
module grounds a text answer — see app/services/call_service.py.
"""

from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.enums import KnowledgeBaseStatus
from app.models.knowledge_base import KnowledgeBase
from app.models.product import Product
from app.services.ai_service import generate_ai_response
from app.services.customer_service import get_customer_by_id
from app.services.knowledge_service import list_knowledge_entries
from app.services.product_service import get_product_by_id

# Caps how much context gets stuffed into the prompt - keeps the
# request bounded and inexpensive even for a product with a large
# knowledge base, and stays well within GEMINI_MAX_OUTPUT_TOKENS'
# input-side counterpart.
MAX_KNOWLEDGE_ENTRIES = 15

SYSTEM_INSTRUCTION = (
    "You are an AI assistant for TechNova Electronics, a CRM's internal admin tool. "
    "Answer the admin's question using ONLY the CONTEXT provided below - product details, "
    "customer details, and knowledge base entries pulled directly from the company's database. "
    "If the answer isn't contained in the context, say plainly that you don't have that "
    "information rather than guessing or using outside knowledge. Be concise and factual."
)


@dataclass
class AIAnswerResult:
    answer: str
    product: Product
    customer: Customer | None
    knowledge_sources: list[KnowledgeBase] = field(default_factory=list)


def format_product_context(product: Product) -> str:
    lines = [
        f"Product: {product.product_name} (code: {product.product_code}, SKU: {product.sku})",
        f"Category: {product.category} | Brand: {product.brand}",
        f"Price: {product.price} | Discount: {product.discount} | Final Price: {product.final_price}",
        f"Stock: {product.stock_quantity} | Availability: {product.availability_status.value}",
    ]
    if product.model_number:
        lines.append(f"Model Number: {product.model_number}")
    if product.warranty:
        lines.append(f"Warranty: {product.warranty}")
    if product.description:
        lines.append(f"Description: {product.description}")
    if product.features:
        lines.append(f"Features: {product.features}")
    if product.specifications:
        lines.append(f"Specifications: {product.specifications}")
    return "\n".join(lines)


def format_customer_context(customer: Customer) -> str:
    lines = [
        f"Customer: {customer.full_name} (code: {customer.customer_code})",
        f"Status: {customer.status.value}",
    ]
    if customer.company:
        lines.append(f"Company: {customer.company}")
    if customer.city or customer.state or customer.country:
        location = ", ".join(filter(None, [customer.city, customer.state, customer.country]))
        lines.append(f"Location: {location}")
    if customer.notes:
        lines.append(f"Notes: {customer.notes}")
    return "\n".join(lines)


def format_knowledge_context(entries: list[KnowledgeBase]) -> str:
    if not entries:
        return "(No knowledge base entries are available for this product.)"

    blocks = []
    for entry in entries:
        keywords = f" [keywords: {entry.keywords}]" if entry.keywords else ""
        blocks.append(f"- {entry.title}{keywords}\n  Q: {entry.question}\n  A: {entry.answer}")
    return "\n".join(blocks)


def fetch_relevant_knowledge(db: Session, product_id: int) -> list[KnowledgeBase]:
    """
    Published Knowledge Base entries for this product, reusing Module 6's
    existing list_knowledge_entries (no separate query logic here).

    Filters by product_id directly in the database query. This used to
    fetch the newest MAX_KNOWLEDGE_ENTRIES published entries across
    every product and filter down to this one in Python afterward —
    which meant a product's own entries could be silently dropped
    entirely whenever other products had enough more-recently-published
    entries to fill that window first. list_knowledge_entries now
    accepts an optional product_id filter (see knowledge_service.py)
    specifically so this queries only what it needs.
    """
    entries, _total = list_knowledge_entries(
        db,
        status_filter=KnowledgeBaseStatus.PUBLISHED,
        product_id=product_id,
        sort="newest",
        page=1,
        page_size=MAX_KNOWLEDGE_ENTRIES,
    )
    return entries


def build_grounded_context(
    db: Session, *, product_id: int, customer_id: int | None = None
) -> tuple[str, Product, Customer | None, list[KnowledgeBase]]:
    """
    Fetch and format everything needed to ground an AI interaction in
    database data — the shared step behind both Module 8's Ask AI and
    Module 9's Voice Calling. Returns (context_text, product, customer,
    knowledge_entries) so callers can both send the text to Gemini/Vapi
    and report back which records grounded the response.

    Raises ProductNotFoundError / CustomerNotFoundError (from the
    reused Module 5/6 service functions) if either id doesn't match a
    real, non-deleted row.
    """
    product = get_product_by_id(db, product_id)
    customer = get_customer_by_id(db, customer_id) if customer_id is not None else None
    knowledge_entries = fetch_relevant_knowledge(db, product_id)

    context_sections = [
        "PRODUCT CONTEXT:",
        format_product_context(product),
        "",
        "KNOWLEDGE BASE CONTEXT:",
        format_knowledge_context(knowledge_entries),
    ]
    if customer is not None:
        context_sections += ["", "CUSTOMER CONTEXT:", format_customer_context(customer)]

    return "\n".join(context_sections), product, customer, knowledge_entries


async def answer_question(
    db: Session,
    *,
    question: str,
    product_id: int,
    customer_id: int | None = None,
) -> AIAnswerResult:
    """
    Build a grounded prompt from database data and get Gemini's answer.

    This function is async because generate_ai_response() needs true
    async I/O for the outbound Gemini call (so a slow AI response
    doesn't block the whole event loop for up to
    GEMINI_TIMEOUT_SECONDS). The database reads under build_grounded_context
    are the same synchronous SQLAlchemy calls every other service in
    this project uses — mixing them in here is a deliberate, small
    tradeoff rather than converting the whole data layer to async
    SQLAlchemy, which is well outside this module's scope. Each query
    is a single bounded SELECT, so the brief blocking cost is negligible.

    Raises ProductNotFoundError / CustomerNotFoundError if either id
    doesn't match a real, non-deleted row - same exceptions the manual
    CRUD routes already raise, so the route layer's error handling is
    consistent.
    """
    context_text, product, customer, knowledge_entries = build_grounded_context(
        db, product_id=product_id, customer_id=customer_id
    )

    prompt = context_text + f"\n\nADMIN'S QUESTION:\n{question.strip()}"

    answer_text = await generate_ai_response(prompt, system_instruction=SYSTEM_INSTRUCTION)

    return AIAnswerResult(
        answer=answer_text,
        product=product,
        customer=customer,
        knowledge_sources=knowledge_entries,
    )
