from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

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

class MessageRequest(BaseModel):
    question: str
    mode: str = "rag"

class ChatErrorResponse(BaseModel):
    error: str
    detail: str