"""
AI Assistant routes.

JWT-protected via get_current_user, same as every other business
route. Thin: validates via Pydantic, calls the context/AI services, and
maps their exceptions to HTTP responses. No AI logic lives here.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AIAskRequest, AIAskResponse
from app.services.ai_context_service import answer_question
from app.utils.exceptions import (
    AIConfigurationError,
    AIServiceError,
    AITimeoutError,
    CustomerNotFoundError,
    ProductNotFoundError,
)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/ask", response_model=AIAskResponse)
async def ask_ai_route(
    payload: AIAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question grounded in a product's details and knowledge base
    (and optionally a customer's details). See
    app/services/ai_context_service.py for how the context is built -
    no RAG, embeddings, or vector search are used anywhere in this path.
    """
    try:
        result = await answer_question(
            db,
            question=payload.question,
            product_id=payload.product_id,
            customer_id=payload.customer_id,
        )
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except AIConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except AITimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    return AIAskResponse(
        answer=result.answer,
        product=result.product,
        customer=result.customer,
        knowledge_sources=result.knowledge_sources,
    )
