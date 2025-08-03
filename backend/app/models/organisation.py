from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.orm import relationship
from db.base import Base

class Organisation(Base):
    __tablename__ = "organisations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(50), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    users = relationship("User", back_populates="organisation", lazy="selectin")
    tender_folders = relationship("TenderFolder", back_populates="organisation", cascade="all, delete-orphan", lazy="selectin")
    join_requests = relationship("OrganisationJoinRequest", back_populates="organisation", cascade="all, delete-orphan", passive_deletes=True)