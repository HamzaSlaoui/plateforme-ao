from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select, update
from models.chat_session import ChatSession
from models.chat_conversation import ChatConversation, MessageRole
from datetime import datetime

class ChatRepository:
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_session_by_user_and_folder(self, user_id: UUID, folder_id: UUID) -> Optional[ChatSession]:
        stmt = select(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.tender_folder_id == folder_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_session(self, user_id: UUID, folder_id: UUID) -> ChatSession:
        session = ChatSession(
            user_id=user_id,
            tender_folder_id=folder_id,
            created_at=datetime.utcnow(),
            last_activity_at=datetime.utcnow()
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session
    
    async def update_session_activity(self, session_id: UUID) -> None:
        stmt = update(ChatSession).where(
            ChatSession.id == session_id
        ).values(last_activity_at=datetime.utcnow())
        await self.db.execute(stmt)
        await self.db.commit()
    
    async def add_message(self, session_id: UUID, role: MessageRole, content: str) -> ChatConversation:
        conversation = ChatConversation(
            chat_session_id=session_id,
            role=role.value,
            content=content,
            created_at=datetime.utcnow()
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation
    
    async def get_recent_messages(self, session_id: UUID, limit: int = 3) -> List[ChatConversation]:
        stmt = select(ChatConversation).filter(
            ChatConversation.chat_session_id == session_id
        ).order_by(desc(ChatConversation.created_at)).limit(limit)
        
        result = await self.db.execute(stmt)
        messages = result.scalars().all()
        return list(reversed(messages))
    
    async def get_all_messages(self, session_id: UUID) -> List[ChatConversation]:
        stmt = select(ChatConversation).filter(
            ChatConversation.chat_session_id == session_id
        ).order_by(ChatConversation.created_at)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()