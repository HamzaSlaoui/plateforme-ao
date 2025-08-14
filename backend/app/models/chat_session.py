from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'tender_folder_id', name='unique_user_folder_session'),
    )
    
    # Relations
    user = relationship("User", back_populates="chat_sessions", lazy="noload")
    tender_folder = relationship("TenderFolder", back_populates="chat_sessions", lazy="noload")
    conversations = relationship("ChatConversation", back_populates="chat_session", cascade="all, delete-orphan", lazy="noload")