from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from db.base import Base
from sqlalchemy.orm import relationship

class OrganisationJoinRequest(Base):
    __tablename__ = "organisation_join_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="en attente")  
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="join_requests", passive_deletes=True)
    organisation = relationship("Organisation", back_populates="join_requests", passive_deletes=True)