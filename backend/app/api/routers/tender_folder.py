from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from uuid import UUID
from typing import List
from api.deps import get_tf_service
from core.security import get_current_verified_user
from schemas.tender_folder import (
    FolderListResponse, TenderFolderCreate, TenderFolderResponse,
)
from schemas.document import DocumentResponse
from services.tender_folder_service import TenderFolderService
from models.user import User

router = APIRouter(prefix="/tender-folders", tags=["tender-folders"])

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_folder(
    data: TenderFolderCreate = Depends(TenderFolderCreate.as_form), 
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    folder = await svc.create_folder(
        data=data,
        creator_id=current_user.id,
        files=files,
    )
    return {"message": "Dossier créé avec succès", "id": str(folder.id)}



@router.get("/", response_model=FolderListResponse)
async def list_folders(
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    if not current_user.organisation_id:
        raise HTTPException(403, "Vous n'appartenez à aucune organisation")

    folders = await svc.list_folders(current_user.organisation_id)
    stats   = await svc.stats(current_user.organisation_id)

    return FolderListResponse(
        folders=[
            TenderFolderResponse(
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
        ],
        stats=stats,
    )

@router.get("/{folder_id}", response_model=TenderFolderResponse)
async def folder_detail(
    folder_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    folder = await svc.one_with_docs(folder_id, current_user.organisation_id)
    if not folder:
        raise HTTPException(404, "Dossier non trouvé")

    docs = [
        DocumentResponse.from_orm_with_base64(d) for d in folder.documents
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
        document_count=len(docs),
        documents=docs,
    )
