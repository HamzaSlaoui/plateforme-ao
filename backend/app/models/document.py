from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, String, DateTime, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=True)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id", ondelete="CASCADE"), nullable=False,index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_content = Column(LargeBinary, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    tender_folder = relationship("TenderFolder", back_populates="documents", lazy="noload")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_documents", lazy="noload")
    embeddings = relationship("Embedding", back_populates="document", cascade="all, delete-orphan", lazy="noload")




