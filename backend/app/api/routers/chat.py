from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from core.security import get_current_verified_user
from schemas.chat import ChatRequest, ChatHistoryResponse, ChatMessageResponse
from services.chat_service import ChatService
from api.deps import get_chat_service
from models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/{folder_id}/message", response_model=ChatMessageResponse)
async def send_message(
    folder_id: UUID,
    request: ChatRequest,
    current_user: User = Depends(get_current_verified_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Envoie un message et reçoit une réponse du chatbot avec historique
    """
    try:
        use_rag = request.mode != "llm"  # Par défaut RAG, sauf si mode="llm"
        
        user_message, assistant_message, metadata = await chat_service.send_message(
            user_id=current_user.id,
            folder_id=folder_id,
            message=request.question,
            use_rag=use_rag
        )
        
        return ChatMessageResponse(
            user_message={
                "id": str(user_message.id),
                "role": user_message.role,
                "content": user_message.content,
                "created_at": user_message.created_at
            },
            assistant_message={
                "id": str(assistant_message.id),
                "role": assistant_message.role,
                "content": assistant_message.content,
                "created_at": assistant_message.created_at
            },
            sources=metadata.get("sources", []),
            mode=metadata.get("mode", "RAG"),
            conversation_length=metadata.get("conversation_length", 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du message: {str(e)}")

@router.get("/{folder_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    folder_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Récupère l'historique complet de la conversation pour un dossier
    """
    try:
        messages = await chat_service.get_conversation_history(
            user_id=current_user.id,
            folder_id=folder_id
        )
        
        return ChatHistoryResponse(
            folder_id=str(folder_id),
            messages=[
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at
                }
                for msg in messages
            ],
            total_messages=len(messages)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'historique: {str(e)}")

@router.delete("/{folder_id}/session")
async def clear_chat_session(
    folder_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Supprime la session de chat (pour "Nouvelle conversation")
    """
    try:
        deleted = await chat_service.clear_session(
            user_id=current_user.id,
            folder_id=folder_id
        )
        
        if deleted:
            return {"message": "Session de chat supprimée avec succès"}
        else:
            return {"message": "Aucune session à supprimer"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


# ENDPOINT DE COMPATIBILITÉ AVEC VOTRE ANCIEN SYSTÈME
# @router.post("/legacy", response_model=ChatResponse)
# async def chat_legacy(
#     request: ChatRequest,
#     current_user: User = Depends(get_current_verified_user),
#     chat_service: ChatService = Depends(get_chat_service)
# ):
#     """
#     Endpoint de compatibilité avec l'ancien système (sans historique persistant)
#     """
#     try:
#         use_rag = request.mode != "llm"
        
#         # Utilise directement le rag_service comme avant
#         if use_rag:
#             rag_response = await chat_service.rag_service.generate_rag_response(
#                 db=chat_service.db,
#                 tender_folder_id=request.dossier_id,
#                 question=request.question
#             )
#         else:
#             rag_response = await chat_service.rag_service.generate_llm_response(
#                 db=chat_service.db,
#                 tender_folder_id=request.dossier_id,
#                 question=request.question
#             )

#         return ChatResponse(
#             reponse=rag_response["reponse"],
#             sources=rag_response["sources"],
#         )
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors du traitement: {str(e)}")