from typing import List, Tuple
from uuid import UUID
from repositories.chat_repository import ChatRepository
from models.chat_session import ChatSession
from models.chat_conversation import ChatConversation, MessageRole
from sqlalchemy.ext.asyncio import AsyncSession

class ChatService:
    
    def __init__(self, db: AsyncSession, rag_service):
        self.db = db
        self.chat_repo = ChatRepository(db)
        self.rag_service = rag_service
    
    async def get_or_create_session(self, user_id: UUID, folder_id: UUID) -> ChatSession:
        session = await self.chat_repo.get_session_by_user_and_folder(user_id, folder_id)
        
        if not session:
            session = await self.chat_repo.create_session(user_id, folder_id)
        
        return session
    
    async def send_message(self, user_id: UUID, folder_id: UUID, message: str, use_rag: bool = True) -> Tuple[ChatConversation, ChatConversation, dict]:
        session = await self.get_or_create_session(user_id, folder_id)
        
        user_message = await self.chat_repo.add_message(
            session.id, MessageRole.USER, message
        )
        
        conversation_history = await self.chat_repo.get_recent_messages(session.id, limit=15)
        
        if use_rag:
            response = await self._generate_rag_response_with_history(
                folder_id, message, conversation_history
            )
            mode = "RAG"
        else:
            response = await self._generate_llm_response_with_history(
                folder_id, message, conversation_history
            )
            mode = "LLM"
        
        assistant_message = await self.chat_repo.add_message(
            session.id, MessageRole.ASSISTANT, response["reponse"]
        )
        
        await self.chat_repo.update_session_activity(session.id)
        
        return user_message, assistant_message, {
            "sources": response.get("sources", []),
            "conversation_length": len(conversation_history) + 1,
            "mode": mode
        }
    
    async def get_conversation_history(self, user_id: UUID, folder_id: UUID) -> List[ChatConversation]:
        session = await self.chat_repo.get_session_by_user_and_folder(user_id, folder_id)
        
        if not session:
            return []
        
        return await self.chat_repo.get_all_messages(session.id)
    
    async def _generate_rag_response_with_history(
        self, 
        folder_id: UUID, 
        user_message: str, 
        conversation_history: List[ChatConversation]
    ) -> dict:
        if conversation_history:
            context_messages = []
            for msg in conversation_history[-3:]:  # 3 derniers messages pour éviter overflow
                role = "Utilisateur" if msg.role == "user" else "Assistant"
                context_messages.append(f"{role}: {msg.content}")
            
            history_context = "\n".join(context_messages)
            
            enhanced_question = f"""
Contexte de la conversation précédente:
{history_context}

Question actuelle: {user_message}
"""
        else:
            enhanced_question = user_message
        
        # Utiliser votre système RAG existant
        return await self.rag_service.generate_rag_response(
            self.db, folder_id, enhanced_question
        )
    
    async def _generate_llm_response_with_history(
        self, 
        folder_id: UUID, 
        user_message: str, 
        conversation_history: List[ChatConversation]
    ) -> dict:
        if conversation_history:
            context_messages = []
            for msg in conversation_history[-3:]:  # 3 derniers messages pour éviter overflow
                role = "Utilisateur" if msg.role == "user" else "Assistant"
                context_messages.append(f"{role}: {msg.content}")
            
            history_context = "\n".join(context_messages)
            
            enhanced_question = f"""
Contexte de la conversation précédente:
{history_context}

Question actuelle: {user_message}
"""
        else:
            enhanced_question = user_message
        
        return await self.rag_service.generate_llm_response(
            self.db, folder_id, enhanced_question
        )
    
    
    async def clear_session(self, user_id: UUID, folder_id: UUID) -> bool:
        session = await self.chat_repo.get_session_by_user_and_folder(user_id, folder_id)
        
        if session:
            await self.db.delete(session)
            await self.db.commit()
            return True
        
        return False