from pydantic import BaseModel, Field, ConfigDict 
from datetime import datetime
from uuid import UUID


class OrganisationInfo(BaseModel):
    id: UUID
    name: str
    code: str

    
class OrganisationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class OrganisationCreate(OrganisationBase):
    pass


class OrganisationResponse(OrganisationBase):
    id: UUID
    created_at: datetime
    code: str
    
    model_config = ConfigDict(from_attributes=True)