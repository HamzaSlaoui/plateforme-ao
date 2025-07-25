from pydantic import BaseModel, Field, ConfigDict 
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict
from enum import Enum

class TenderStatusEnum(str, Enum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    GAGNE = "gagne"
    PERDU = "perdu"

class TenderFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    submission_deadline: Optional[datetime] = None
    client_name: Optional[str] = Field(None, max_length=255)


class TenderFolderCreate(TenderFolderBase):
    pass


class TenderFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TenderStatusEnum] = None
    submission_deadline: Optional[datetime] = None
    client_name: Optional[str] = Field(None, max_length=255)


class TenderFolderResponse(TenderFolderBase):
    id: UUID
    status: TenderStatusEnum
    organisation_id: UUID
    created_by: UUID
    created_at: datetime

    # Nombre de documents (pour le badge "Pièces jointes")
    document_count: int

    model_config = ConfigDict(from_attributes=True)

class FolderListResponse(BaseModel):
    folders: List[TenderFolderResponse]
    stats: Dict[str, int]

    
class TenderDetailResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    deadline: Optional[datetime]
    status: str
    attachments: List[str]
    createdAt: datetime

    # alias Pydantic
    model_config = ConfigDict(from_attributes=True)
