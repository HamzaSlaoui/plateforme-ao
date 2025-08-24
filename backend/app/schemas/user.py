from pydantic import BaseModel, EmailStr, Field, ConfigDict 
from datetime import datetime
from uuid import UUID
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    firstname: str = Field(..., min_length=1, max_length=100)
    lastname: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    firstname: Optional[str] = Field(None, min_length=1, max_length=100)
    lastname: Optional[str] = Field(None, min_length=1, max_length=100)


class UserResponse(BaseModel):
    id: UUID
    firstname: str
    lastname: str
    email: str
    is_verified: bool
    is_owner: bool
    organization_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)