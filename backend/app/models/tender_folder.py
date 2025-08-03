from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Column, ForeignKey, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.orm import relationship
from enum import Enum
from db.base import Base

class TenderStatus(str, Enum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    GAGNE = "gagne"
    PERDU = "perdu"

class TenderFolder(Base):
    __tablename__ = "tender_folders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=TenderStatus.EN_COURS.value)
    submission_deadline = Column(DateTime, nullable=True)
    client_name = Column(String(50), nullable=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(tz=timezone.utc))
    
    # Relations
    organisation = relationship("Organisation", back_populates="tender_folders", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_folders", lazy="selectin")
    documents = relationship("Document", back_populates="tender_folder", cascade="all, delete-orphan", lazy="selectin")
    embeddings = relationship("Embedding", back_populates="tender_folder")









# class Dossier(Base):
#     __tablename__ = "dossiers"
    
#     id = Column(Integer, primary_key=True)
#     nom = Column(String(255), nullable=False)
#     client = Column(String(255))
#     description = Column(Text)
#     date_limite = Column(DateTime)
#     created_at = Column(DateTime, default=datetime.utcnow)
    
#     documents = relationship("Document", back_populates="dossier")
#     embeddings = relationship("Embedding", back_populates="dossier")