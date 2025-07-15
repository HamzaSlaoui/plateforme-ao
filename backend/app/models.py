# models.py
from datetime import datetime
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from passlib.context import CryptContext

Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TenderStatus(str, Enum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    GAGNE = "gagne"
    PERDU = "perdu"


class Organisation(Base):
    __tablename__ = "organisations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    users = relationship("User", back_populates="organisation", lazy="selectin")
    tender_folders = relationship("TenderFolder", back_populates="organisation", cascade="all, delete-orphan", lazy="selectin")


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_owner = Column(Boolean, default=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    organisation = relationship("Organisation", back_populates="users", lazy="selectin")
    created_folders = relationship("TenderFolder", foreign_keys="TenderFolder.created_by", back_populates="creator", lazy="selectin")
    uploaded_documents = relationship("Document", foreign_keys="Document.uploaded_by", back_populates="uploader", lazy="selectin")
    
    # Méthodes pour le password
    def set_password(self, password: str):
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)


class TenderFolder(Base):
    __tablename__ = "tender_folders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=TenderStatus.EN_COURS.value)
    submission_deadline = Column(DateTime, nullable=True)
    client_name = Column(String(255), nullable=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    organisation = relationship("Organisation", back_populates="tender_folders", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_folders", lazy="selectin")
    documents = relationship("Document", back_populates="tender_folder", cascade="all, delete-orphan", lazy="selectin")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    document_type = Column(String(50), nullable=True)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    tender_folder = relationship("TenderFolder", back_populates="documents", lazy="selectin")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_documents", lazy="selectin")
