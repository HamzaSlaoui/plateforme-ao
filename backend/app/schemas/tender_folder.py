from fastapi import Form
from pydantic import BaseModel, Field, ConfigDict 
from datetime import date, datetime
from uuid import UUID
from typing import List, Optional, Dict
from enum import Enum
from .document import DocumentResponse

class TenderStatusEnum(str, Enum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    GAGNE = "gagne"
    PERDU = "perdu"


class TenderFolderCreate(BaseModel):
    name: str
    description: str | None
    status: str
    submission_deadline: date | None
    client_name: str | None
    organisation_id: UUID

    @classmethod
    def as_form(cls,            
                name: str = Form(...),
                description: Optional[str] = Form(None),
                status: str = Form(...),
                submission_deadline: Optional[date] = Form(None),
                client_name: Optional[str] = Form(None),
                organisation_id: UUID = Form(...),
    ):
        return cls(
            name=name,
            description=description,
            status=status,
            submission_deadline=submission_deadline,
            client_name=client_name,
            organisation_id=organisation_id,
        )



class TenderFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TenderStatusEnum] = None
    submission_deadline: Optional[date] = None
    client_name: Optional[str] = Field(None, max_length=255)


class TenderFolderResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    submission_deadline: Optional[date]
    client_name: Optional[str]
    organisation_id: UUID
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
 

class TenderFolderLiteResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: str
    submission_deadline: Optional[date]
    client_name: Optional[str]
    organisation_id: UUID
    created_by: UUID
    created_at: datetime
    document_count: int
