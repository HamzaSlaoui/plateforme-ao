from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# Schémas existants (gardés pour compatibilité)
class ChatRequest(BaseModel):
    question: str
    mode: str = "rag"  # "rag" ou "llm"
    dossier_id: Optional[UUID] = None  # Pour compatibilité legacy

class ChatResponse(BaseModel):
    reponse: str
    sources: List[Dict[str, Any]]

# Nouveaux schémas pour le système avec historique
class ChatMessageSchema(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

class ChatMessageResponse(BaseModel):
    user_message: ChatMessageSchema
    assistant_message: ChatMessageSchema
    sources: List[Dict[str, Any]]
    mode: str
    conversation_length: int

class ChatHistoryResponse(BaseModel):
    folder_id: str
    messages: List[ChatMessageSchema]
    total_messages: int

# Schéma pour les requêtes de message simple
class MessageRequest(BaseModel):
    question: str
    mode: str = "rag"

# Schémas pour les réponses d'erreur
class ChatErrorResponse(BaseModel):
    error: str
    detail: str