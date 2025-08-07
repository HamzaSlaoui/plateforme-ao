from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey 
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from db.base import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_owner = Column(Boolean, default=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    organisation = relationship("Organisation", back_populates="users", lazy="selectin", passive_deletes=True)
    created_folders = relationship("TenderFolder", foreign_keys="TenderFolder.created_by", back_populates="creator", lazy="selectin")
    uploaded_documents = relationship("Document", foreign_keys="Document.uploaded_by", back_populates="uploader", lazy="selectin")
    join_requests = relationship("OrganisationJoinRequest", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    def set_password(self, password: str):
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)