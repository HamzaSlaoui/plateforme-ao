from uuid import UUID
from typing import List
import requests
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from db.session import get_db
from core.security import get_current_user
from models.user import User
from models.tender_folder import TenderFolder
from services.vector_database import qdrant_client, qdrant_collection, embed_text

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str
    folder_id: UUID

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

@router.post("/chat", response_model=ChatResponse)
async def chat_with_folder(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Chatbot RAG pour un dossier spécifique.
    Recherche dans les documents vectorisés du dossier et génère une réponse.
    """
    # 1. Vérifier que le dossier existe et appartient à l'organisation de l'utilisateur
    stmt = select(TenderFolder).where(
        TenderFolder.id == request.folder_id,
        TenderFolder.organisation_id == current_user.organisation_id
    )
    result = await db.execute(stmt)
    folder = result.scalar_one_or_none()

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé ou accès non autorisé"
        )

    # 2. Vectoriser la question de l'utilisateur
    try:
        question_vector = embed_text(request.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vectorisation: {str(e)}"
        )

    # 3. Rechercher dans Qdrant les chunks les plus similaires pour ce dossier
    try:
        # D'abord, essayons avec le filtre (méthode préférée)
        search_results = qdrant_client.search(
            collection_name=qdrant_collection,
            query_vector=question_vector,
            query_filter={
                "must": [
                    {"key": "tender_folder_id", "match": {"value": str(request.folder_id)}}
                ]
            },
            limit=10,
            score_threshold=0.3
        )
    except Exception as filter_error:
        # Si l'erreur est due à l'absence d'index, essayons sans filtre
        if "Index required but not found" in str(filter_error):
            try:
                # Recherche sans filtre, puis filtrage manuel
                all_results = qdrant_client.search(
                    collection_name=qdrant_collection,
                    query_vector=question_vector,
                    limit=50,
                    score_threshold=0.3
                )
                search_results = [
                    result for result in all_results
                    if result.payload.get("tender_folder_id") == str(request.folder_id)
                ][:5]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur lors de la recherche vectorielle (fallback): {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la recherche vectorielle: {str(filter_error)}"
            )

    # 4. Construire le contexte à partir des chunks trouvés
    context_chunks = []
    unique_filenames = set()
    for result in search_results:
        chunk_text = result.payload.get("text", "")
        if chunk_text:
            context_chunks.append(chunk_text)
            filename = result.payload.get("filename")
            if filename:
                unique_filenames.add(filename)
    sources = list(unique_filenames)

    if not context_chunks:
        return ChatResponse(
            response="Je n'ai pas trouvé d'informations pertinentes dans les documents de ce dossier pour répondre à votre question.",
            sources=[]
        )

    # 5. Construire le prompt pour l'IA
    context = f"""
Vous êtes un assistant IA spécialisé dans l'analyse d'appels d'offres. 
Votre rôle est d'aider l'utilisateur à comprendre et analyser les documents du dossier d'appel d'offres.

CONTEXTE DU DOSSIER:
Dossier: {folder.name}
Description: {folder.description or "Aucune description"}
Client: {folder.client_name or "Non spécifié"}
Statut: {folder.status}

DOCUMENTS PERTINENTS:
{chr(10).join(f"- {chunk}" for chunk in context_chunks)}

QUESTION DE L'UTILISATEUR:
{request.message}

INSTRUCTIONS:
- Répondez en français de manière professionnelle et précise
- Basez-vous uniquement sur les informations fournies dans les documents
- Si vous ne trouvez pas la réponse dans les documents, dites-le clairement
- Structurez votre réponse de manière claire avec des points ou paragraphes si nécessaire
- Mentionnez les éléments spécifiques des documents qui supportent votre réponse
- Restez dans le contexte des appels d'offres et de l'analyse de documents

Réponse:"""

    # 6. Appeler l'API OpenRouter avec GPT-4o-mini via requests
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer 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"
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [{"role": "user", "content": context}]
            }
        )
        response.raise_for_status()
        ai_response = response.json()
        generated_text = ai_response["choices"][0]["message"]["content"].strip()
        return ChatResponse(
            response=generated_text,
            sources=sources
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'appel à l'API OpenRouter: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue: {str(e)}"
        )
