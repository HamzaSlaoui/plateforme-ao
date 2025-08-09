from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.chat import ChatRequest, ChatResponse
from services.rag_service import rag_service
from db.session import get_db

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    if request.mode == "llm":
        rag_response = await rag_service.generate_llm_response(
            db=db,
            tender_folder_id=request.dossier_id,
            question=request.question
        )
    else:
        rag_response = await rag_service.generate_rag_response(
            db=db,
            tender_folder_id=request.dossier_id,
            question=request.question
        )

    return ChatResponse(
        reponse=rag_response["reponse"],
        sources=rag_response["sources"],
    )