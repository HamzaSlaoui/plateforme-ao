from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from db.base import Base

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id", ondelete="CASCADE"), nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    embedding = Column(Vector(1024))
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer)
    extra_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    document = relationship("Document", back_populates="embeddings", lazy="selectin")
    tender_folder = relationship("TenderFolder", back_populates="embeddings")
