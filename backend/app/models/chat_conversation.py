from uuid import uuid4
from sqlalchemy import UUID, Column, Text, DateTime, ForeignKey, JSON
from db.base import Base
from datetime import datetime

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tender_folder_id = Column(UUID(as_uuid=True), ForeignKey("tender_folders.id"))
    question = Column(Text, nullable=False)
    reponse = Column(Text, nullable=False)
    sources = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)