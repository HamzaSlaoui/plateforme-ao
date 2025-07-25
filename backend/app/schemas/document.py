from pydantic import BaseModel, Field, ConfigDict 
from datetime import datetime
from uuid import UUID
from typing import Optional


class DocumentBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    document_type: Optional[str] = Field(None, max_length=50)


class DocumentResponse(DocumentBase):
    id: UUID
    filepath: str
    tender_folder_id: UUID
    uploaded_by: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
