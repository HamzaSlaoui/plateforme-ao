from pydantic import BaseModel, Field, ConfigDict 
from datetime import datetime
from uuid import UUID
from schemas.user import UserResponse


class OrganizationInfo(BaseModel):
    id: UUID
    name: str
    code: str


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: UUID
    name: str
    created_at: datetime
    code: str
    
    model_config = ConfigDict(from_attributes=True)

class OrganizationCreateResponse(BaseModel):
    organization: OrganizationResponse
    user: UserResponse