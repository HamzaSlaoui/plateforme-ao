from ast import Dict
from uuid import UUID, uuid4
from datetime import datetime
from typing import List, Optional

from sqlalchemy import func, select

import PyPDF2 
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy.orm import selectinload

from services.vectore_database import qdrant_client, qdrant_collection, embed_text

from db.session import get_db
from core.security import get_current_user
from models.tender_folder import TenderFolder, TenderStatus
from models.document import Document
from models.document_chunk import DocumentChunk
from models.user import User
from schemas.tender_folder import FolderListResponse, TenderFolderResponse  # votre Pydantic response_model

router = APIRouter(prefix="/tender-folders", tags=["tender-folders"])


@router.post("/create", response_model=TenderFolderResponse)
async def create_tender_folder(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    status: str = Form(TenderStatus.EN_COURS.value),
    submission_deadline: Optional[datetime] = Form(None),
    client_name: Optional[str] = Form(None),
    organisation_id: UUID = Form(...),
    files: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1) Création du dossier
    tender_folder = TenderFolder(
        name=name,
        description=description,
        status=status,
        submission_deadline=submission_deadline,
        client_name=client_name,
        organisation_id=organisation_id,
        created_by=current_user.id
    )
    db.add(tender_folder)
    await db.commit()
    await db.refresh(tender_folder)

    # 2) Traitement des fichiers PDF
    if files:
        for upload in files:
            # Vérification du type MIME
            if upload.content_type != "application/pdf":
                raise HTTPException(
                    status_code=415,
                    detail=f"Le fichier {upload.filename} n'est pas un PDF."
                )

            # Création de l'enregistrement Document
            document = Document(
                filename=upload.filename,
                document_type="PDF",
                tender_folder_id=tender_folder.id,
                uploaded_by=current_user.id
            )
            db.add(document)
            await db.commit()
            await db.refresh(document)

            # Extraction du texte PDF
            try:
                reader = PyPDF2.PdfReader(upload.file)
                full_text = ""
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n"
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur lors de l'extraction du texte du PDF {upload.filename}: {str(e)}"
                )

            # Découpage en chunks de 1000 caractères
            if full_text.strip():  # Vérifier qu'il y a du texte à traiter
                CHUNK_SIZE = 1000
                chunks = [
                    full_text[i : i + CHUNK_SIZE]
                    for i in range(0, len(full_text), CHUNK_SIZE)
                ]
                
                # Traitement des chunks avec gestion d'erreur
                for idx, chunk_text in enumerate(chunks):
                    if chunk_text.strip():  # Ignorer les chunks vides
                        try:
                            # Sauvegarde en base de données
                            db.add(DocumentChunk(
                                document_id=document.id,
                                chunk_text=chunk_text,
                                chunk_order=idx
                            ))
                            
                            # Vectorisation et insertion dans Qdrant
                            vector = embed_text(chunk_text)
                            
                            # Préparation du point Qdrant
                            point_data = {
                                "id": str(uuid4()),  # UUID valide pour Qdrant
                                "vector": vector,
                                "payload": {
                                    "document_id": str(document.id),
                                    "chunk_order": idx,
                                    "text": chunk_text,
                                    "tender_folder_id": str(tender_folder.id),
                                    "filename": upload.filename,  # Ajout du nom de fichier pour de meilleures sources
                                }
                            }
                            
                            # Insertion dans Qdrant avec gestion d'erreur
                            qdrant_client.upsert(
                                collection_name=qdrant_collection,
                                points=[point_data]
                            )
                            
                        except Exception as e:
                            # Log l'erreur mais continue le traitement
                            print(f"Erreur lors du traitement du chunk {idx} du document {upload.filename}: {str(e)}")
                            # Vous pourriez vouloir utiliser un logger ici
                            continue

        # On commit tous les chunks d'un coup
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la sauvegarde des chunks: {str(e)}"
            )
    
    # 3) Ajouter le document_count avant de retourner
    setattr(tender_folder, "document_count", len(files) if files else 0)
    
    return tender_folder


# @router.get(
#     "/",
#     response_model=List[TenderFolderResponse],
#     status_code=status.HTTP_200_OK,
# )
# async def list_tender_folders(
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
#     # 1️⃣ Vérifier que l'utilisateur appartient bien à une organisation
#     if current_user.organisation_id is None:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Vous n'appartenez à aucune organisation",
#         )

#     # 2️⃣ Charger les dossiers + leurs documents en un seul appel
#     stmt = (
#         select(TenderFolder)
#         .options(selectinload(TenderFolder.documents))
#         .where(TenderFolder.organisation_id == current_user.organisation_id)
#     )
#     result = await db.execute(stmt)
#     folders: List[TenderFolder] = result.scalars().all()

#     # 3️⃣ Injecter le nombre de documents (pour votre response_model)
#     for f in folders:
#         # On ajoute dynamiquement l'attribut attendu par Pydantic
#         setattr(f, "document_count", len(f.documents))

#     return folders



@router.get("/", response_model=FolderListResponse, status_code=status.HTTP_200_OK)
async def list_tender_folders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1️⃣ Vérif organisation
    if current_user.organisation_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'appartenez à aucune organisation",
        )

    org_id = current_user.organisation_id

    # 2️⃣ Récupérer tous les dossiers + documents
    stmt = (
        select(TenderFolder)
        .options(selectinload(TenderFolder.documents))
        .where(TenderFolder.organisation_id == org_id)
    )
    result = await db.execute(stmt)
    folders = result.scalars().all()

    # Injecter document_count
    for f in folders:
        setattr(f, "document_count", len(f.documents))

    # 3️⃣ Calculer les stats par status
    count_stmt = (
        select(TenderFolder.status, func.count())
        .where(TenderFolder.organisation_id == org_id)
        .group_by(TenderFolder.status)
    )
    count_res = await db.execute(count_stmt)
    raw_stats = dict(count_res.all())  # ex. {"draft": 3, "in-progress": 5, ...}

    # Assurer que chaque statut figure dans le dict (optionnel)
    all_statuses = ["en_cours", "soumis", "gagne", "perdu"]
    stats: Dict[str,int] = { status: raw_stats.get(status, 0) for status in all_statuses }

    return FolderListResponse(
        folders=folders,
        stats=stats
    )


@router.get(
    "/{folder_id}",
    response_model=TenderFolderResponse,
    status_code=status.HTTP_200_OK,
)
async def get_tender_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(TenderFolder)
        .options(selectinload(TenderFolder.documents))  # charger les docs
        .where(
            TenderFolder.id == folder_id,
            TenderFolder.organisation_id == current_user.organisation_id,
        )
    )
    result = await db.execute(stmt)
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dossier non trouvé")
    # Injecter le nombre de documents pour Pydantic
    setattr(folder, "document_count", len(folder.documents))
    return folder





# @router.get(
#     "/{folder_id}",
#     response_model=TenderDetailResponse,
#     status_code=status.HTTP_200_OK,
# )
# async def get_tender_folder(
#     folder_id: UUID,
#     current_user=Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
#     # On vérifie que le dossier appartient à l'organisation de l'utilisateur
#     stmt = (
#         select(TenderFolder)
#         .options(selectinload(TenderFolder.documents))
#         .where(
#             TenderFolder.id == folder_id,
#             TenderFolder.organisation_id == current_user.organisation_id,
#         )
#     )
#     result = await db.execute(stmt)
#     folder = result.scalar_one_or_none()
#     if not folder:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Dossier non trouvé"
#         )

#     # Liste des noms de fichiers
#     attachments = [doc.filename for doc in folder.documents]

#     return TenderDetailResponse(
#         id=folder.id,
#         title=folder.name,
#         description=folder.description,
#         deadline=folder.submission_deadline,
#         status=folder.status,
#         attachments=attachments,
#         createdAt=folder.created_at,
#     )
