from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from models.chat_conversation import ChatConversation
from schemas.chat import ChatRequest, ChatResponse
from core.config import Config
from services.rag_service import RAGService
from db.session import get_db

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

rag_service = RAGService(
    api_key=Config.OPENROUTER_API_KEY,
    base_url=Config.OPENROUTER_BASE_URL
)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Chat RAG avec un dossier spécifique"""
    # Génération de la réponse RAG
    rag_response = await rag_service.generate_rag_response(
        db=db,
        tender_folder_id=request.dossier_id,
        question=request.question
    )
    
    # Sauvegarde de la conversation
    conversation = ChatConversation(
        tender_folder_id=request.dossier_id,
        question=request.question,
        reponse=rag_response["reponse"],
        sources=rag_response["sources"]
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return ChatResponse(
        reponse=rag_response["reponse"],
        sources=rag_response["sources"],
        conversation_id=conversation.id
    )