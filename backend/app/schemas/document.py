from pydantic import BaseModel, Field 
from datetime import datetime
from uuid import UUID
from typing import Optional
import base64

class DocumentBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    document_type: Optional[str] = Field(None, max_length=50)

class DocumentResponse(DocumentBase):
    id: UUID
    tender_folder_id: UUID
    uploaded_by: UUID
    created_at: datetime
    file_content: Optional[str] = None

    @classmethod
    def from_orm_with_base64(cls, doc):
        return cls(
            id=doc.id,
            filename=doc.filename,
            file_type=doc.file_type,
            tender_folder_id=doc.tender_folder_id,
            uploaded_by=doc.uploaded_by,
            created_at=doc.created_at,
            file_content=base64.b64encode(doc.file_content).decode("utf-8") if doc.file_content else None
        )


