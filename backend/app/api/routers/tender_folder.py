from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from uuid import UUID
from typing import List
from api.deps import get_tf_service
from core.security import get_current_verified_user
from schemas.tender_folder import (
    FolderListResponse, TenderFolderCreate, TenderFolderResponse, UpdateStatusPayload,
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
async def list_folders_optimized(
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    if not current_user.organisation_id:
        raise HTTPException(403, "Vous n'appartenez à aucune organisation")

    data = await svc.list_folders_with_stats(current_user.organisation_id)
    
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
                document_count=getattr(f, 'document_count', 0),  # Document count from SQL
            )
            for f in data["folders"]
        ],
        stats=data["stats"],
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

@router.put("/{folder_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def update_folder_status(
    folder_id: UUID,
    payload: UpdateStatusPayload,
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    updated = await svc.update_status(folder_id, current_user.organisation_id, payload.status)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dossier introuvable")


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    deleted = await svc.delete(folder_id, current_user.organisation_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dossier introuvable")
    

@router.post("/{folder_id}/documents", status_code=status.HTTP_201_CREATED)
async def add_documents_to_folder(
    folder_id: UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_verified_user),
    svc: TenderFolderService = Depends(get_tf_service),
):
    """
    Ajoute un ou plusieurs documents à un dossier existant (du même org que l'utilisateur).
    """
    if not files or len(files) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Aucun fichier fourni")

    try:
        created_docs = await svc.add_documents(
            folder_id=folder_id,
            org_id=current_user.organisation_id,
            uploader_id=current_user.id,
            files=files,
        )
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except PermissionError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé à ce dossier")
    except FileNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dossier introuvable")

    return {
        "message": "Documents ajoutés avec succès",
        "count": len(created_docs),
        "documents": [
            {
                "id": str(d.id),
                "filename": d.filename,
                "file_type": d.file_type,
                "created_at": d.created_at,
            }
            for d in created_docs
        ],
    }