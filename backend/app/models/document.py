from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    filename = Column(String(255), nullable=False)
    document_type = Column(String(10), nullable=True)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)

    tender_folder = relationship("TenderFolder", back_populates="documents", lazy="selectin")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_documents", lazy="selectin")
    embeddings = relationship("Embedding", back_populates="document", cascade="all, delete-orphan", lazy="selectin")







# class Document(Base):
#     __tablename__ = "documents"
    
#     id = Column(Integer, primary_key=True)
#     dossier_id = Column(Integer, ForeignKey("dossiers.id"))
#     nom_fichier = Column(String(255), nullable=False)
#     type_fichier = Column(String(50))
#     taille = Column(Integer)
#     chemin_stockage = Column(String(500))
#     created_at = Column(DateTime, default=datetime.utcnow)
    
#     dossier = relationship("Dossier", back_populates="documents")
#     embeddings = relationship("Embedding", back_populates="document")