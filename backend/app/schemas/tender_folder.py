from fastapi import Form
from pydantic import BaseModel, ConfigDict 
from datetime import date, datetime
from uuid import UUID
from typing import List, Optional, Dict
from enum import Enum
from .document import DocumentResponse
from typing import Literal

class TenderStatusEnum(str, Enum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    GAGNE = "gagne"
    PERDU = "perdu"


class TenderFolderCreate(BaseModel):
    name: str
    description: str | None
    submission_deadline: date | None
    client_name: str | None
    organization_id: UUID

    @classmethod
    def as_form(cls,            
                name: str = Form(...),
                description: Optional[str] = Form(None),
                submission_deadline: Optional[date] = Form(None),
                client_name: Optional[str] = Form(None),
                organization_id: UUID = Form(...),
    ):
        return cls(
            name=name,
            description=description,
            submission_deadline=submission_deadline,
            client_name=client_name,
            organization_id=organization_id,
        )

class UpdateStatusPayload(BaseModel):
    status: Literal["en_cours", "soumis", "gagne", "perdu"]


class TenderFolderResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    submission_deadline: Optional[date]
    client_name: Optional[str]
    organization_id: UUID
    created_by: UUID
    created_at: datetime
    document_count: int = 0
    documents: List[DocumentResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class FolderListResponse(BaseModel):
    folders: List[TenderFolderResponse]
    stats: Dict[str, int]

    
class TenderDetailResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    deadline: Optional[date]
    status: str
    attachments: List[str]
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
 
