from uuid import UUID
from openai import BaseModel
from typing import List

class ChatRequest(BaseModel):
    question: str
    dossier_id: UUID

class ChatResponse(BaseModel):
    reponse: str
    sources: List[dict]
