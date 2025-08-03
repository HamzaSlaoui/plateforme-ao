from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy import func, select

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status  # type: ignore
from fastapi.responses import JSONResponse 
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload

from services.rag_service import RAGService

from db.session import get_db
from core.security import get_current_verified_user
from models.tender_folder import TenderFolder, TenderStatus
from models.document import Document
from models.user import User
from schemas.document import DocumentResponse
from schemas.tender_folder import FolderListResponse, TenderFolderResponse, TenderFolderLiteResponse
from core.config import Config

rag_service = RAGService(
    api_key=Config.OPENROUTER_API_KEY,
    base_url=Config.OPENROUTER_BASE_URL
)

router = APIRouter(prefix="/tender-folders", tags=["tender-folders"])




@router.post("/create")
async def create_tender_folder_sync(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    status: str = Form(...),
    submission_deadline: Optional[datetime] = Form(None),
    client_name: Optional[str] = Form(None),
    organisation_id: UUID = Form(...),
    files: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """Créer un nouveau dossier avec traitement synchrone des documents"""

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

    if files:
        for upload_file in files:
            if not upload_file.filename or upload_file.size == 0:
                continue

            try:
                file_content = await upload_file.read()

                document = Document(
                    tender_folder_id=tender_folder.id,
                    filename=upload_file.filename,
                    document_type=upload_file.filename.split('.')[-1].lower(),
                    uploaded_by=current_user.id,
                    file_content=file_content
                )

                db.add(document)
                await db.commit()
                await db.refresh(document)

                await rag_service.process_document(
                    db=db,
                    tender_folder_id=tender_folder.id,
                    document_id=document.id,
                    file_content=file_content,
                    file_type=document.document_type
                )
                await db.commit()

            except Exception as e:
                print(f"Erreur avec {upload_file.filename}: {e}")

    return JSONResponse(
        content={
            "message": "Dossier créé avec succès",
            "id": str(tender_folder.id)
        },
        status_code=201
    )


@router.get("/", response_model=FolderListResponse)
async def get_dossiers(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.organisation_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'appartenez à aucune organisation",
        )

    org_id = current_user.organisation_id

    stmt = (
        select(TenderFolder)
        .options(selectinload(TenderFolder.documents))
        .where(TenderFolder.organisation_id == org_id)
    )
    result = await db.execute(stmt)
    folders = result.scalars().all()

    folders_response = [
        TenderFolderLiteResponse(
            id=f.id,
            name=f.name,
            description=f.description,
            status=f.status,
            submission_deadline=f.submission_deadline,
            client_name=f.client_name,
            organisation_id=f.organisation_id,
            created_by=f.created_by,
            created_at=f.created_at,
            document_count=len(f.documents),
        )
        for f in folders
    ]



    count_stmt = (
        select(TenderFolder.status, func.count())
        .where(TenderFolder.organisation_id == org_id)
        .group_by(TenderFolder.status)
    )
    count_res = await db.execute(count_stmt)
    raw_stats = dict(count_res.all())

    all_statuses = ["en_cours", "soumis", "gagne", "perdu"]
    stats: Dict[str, int] = {status: raw_stats.get(status, 0) for status in all_statuses}

    return FolderListResponse(
        folders=folders_response,
        stats=stats
    )


@router.get("/{folder_id}", response_model=TenderFolderResponse)
async def get_tender_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    stmt = (
        select(TenderFolder)
        .options(selectinload(TenderFolder.documents))
        .where(
            TenderFolder.id == folder_id,
            TenderFolder.organisation_id == current_user.organisation_id,
        )
    )
    result = await db.execute(stmt)
    folder = result.scalar_one_or_none()

    if not folder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dossier non trouvé")

    documents = [
        DocumentResponse.from_orm_with_base64(doc)
        for doc in folder.documents
    ]

    return TenderFolderResponse(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        status=folder.status,
        submission_deadline=folder.submission_deadline,
        client_name=folder.client_name,
        organisation_id=folder.organisation_id,
        created_by=folder.created_by,
        created_at=folder.created_at,
        document_count=len(documents),
        documents=documents
    )
