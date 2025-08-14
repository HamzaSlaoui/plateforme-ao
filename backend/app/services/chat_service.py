from typing import List, Optional, Tuple
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
        """
        Récupère la session existante ou en crée une nouvelle
        pour un utilisateur et un dossier donné
        """
        # Chercher session existante
        session = await self.chat_repo.get_session_by_user_and_folder(user_id, folder_id)
        
        if not session:
            # Créer nouvelle session
            session = await self.chat_repo.create_session(user_id, folder_id)
        
        return session
    
    async def send_message(self, user_id: UUID, folder_id: UUID, message: str, use_rag: bool = True) -> Tuple[ChatConversation, ChatConversation, dict]:
        """
        Traite un message utilisateur et génère une réponse
        Retourne: (message_user, message_assistant, metadata)
        """
        # 1. Récupérer ou créer session
        session = await self.get_or_create_session(user_id, folder_id)
        
        # 2. Sauvegarder message utilisateur
        user_message = await self.chat_repo.add_message(
            session.id, MessageRole.USER, message
        )
        
        # 3. Récupérer historique pour contexte
        conversation_history = await self.chat_repo.get_recent_messages(session.id, limit=15)
        
        # 4. Générer réponse avec le mode choisi (RAG ou LLM complet)
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
        
        # 5. Sauvegarder réponse assistant
        assistant_message = await self.chat_repo.add_message(
            session.id, MessageRole.ASSISTANT, response["reponse"]
        )
        
        # 6. Mettre à jour activité session
        await self.chat_repo.update_session_activity(session.id)
        
        return user_message, assistant_message, {
            "sources": response.get("sources", []),
            "conversation_length": len(conversation_history) + 1,
            "mode": mode
        }
    
    async def get_conversation_history(self, user_id: UUID, folder_id: UUID) -> List[ChatConversation]:
        """
        Récupère l'historique complet de conversation pour affichage
        """
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
        """
        Génère une réponse en utilisant RAG + historique de conversation
        """
        # Construire le contexte conversationnel
        if conversation_history:
            context_messages = []
            for msg in conversation_history[-10:]:  # 10 derniers messages pour éviter overflow
                role = "Utilisateur" if msg.role == "user" else "Assistant"
                context_messages.append(f"{role}: {msg.content}")
            
            history_context = "\n".join(context_messages)
            
            # Enrichir la question avec le contexte conversationnel
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
        """
        Génère une réponse avec LLM complet + historique de conversation
        """
        # Construire le contexte conversationnel
        if conversation_history:
            context_messages = []
            for msg in conversation_history[-10:]:  # 10 derniers messages pour éviter overflow
                role = "Utilisateur" if msg.role == "user" else "Assistant"
                context_messages.append(f"{role}: {msg.content}")
            
            history_context = "\n".join(context_messages)
            
            # Enrichir la question avec le contexte conversationnel
            enhanced_question = f"""
Contexte de la conversation précédente:
{history_context}

Question actuelle: {user_message}
"""
        else:
            enhanced_question = user_message
        
        # Utiliser votre méthode LLM complète
        return await self.rag_service.generate_llm_response(
            self.db, folder_id, enhanced_question
        )
    
    
    async def clear_session(self, user_id: UUID, folder_id: UUID) -> bool:
        """
        Supprime une session de chat (pour "Nouvelle conversation")
        """
        session = await self.chat_repo.get_session_by_user_and_folder(user_id, folder_id)
        
        if session:
            await self.db.delete(session)
            await self.db.commit()
            return True
        
        return False