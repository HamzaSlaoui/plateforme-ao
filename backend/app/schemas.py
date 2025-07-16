# schemas.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict # type: ignore
from datetime import datetime
from uuid import UUID
from typing import Optional
from enum import Enum


class TenderStatusEnum(str, Enum):
    EN_COURS = "en_cours"
    TERMINE = "termine"
    ANNULE = "annule"


# --- Schémas User ---
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


class UserResponse(UserBase):
    id: UUID
    is_verified: bool
    is_owner: bool
    organisation_id: Optional[UUID]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Schémas Organisation ---
class OrganisationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=3, max_length=100)


class OrganisationCreate(OrganisationBase):
    pass


class OrganisationResponse(OrganisationBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Schémas TenderFolder ---
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
    
    model_config = ConfigDict(from_attributes=True)


# --- Schémas Document ---
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


# --- Schémas Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class EmailVerification(BaseModel):
    token: str


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=50)
