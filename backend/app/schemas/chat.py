from pydantic import BaseModel
from typing import Literal
from uuid import UUID
from typing import List

class ChatRequest(BaseModel):
    question: str
    dossier_id: UUID
    mode: Literal["rag", "llm"] = "rag"


class ChatResponse(BaseModel):
    reponse: str
    sources: List[dict]