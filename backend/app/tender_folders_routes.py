from uuid import UUID, uuid4
from datetime import datetime
from typing import List, Optional

import PyPDF2 
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore

from database import get_db
from auth import get_current_user
from models import (
    TenderFolder,
    Document,
    DocumentChunk,
    TenderStatus,
    User
)
from schemas import TenderFolderResponse  # votre Pydantic response_model

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
            reader = PyPDF2.PdfReader(upload.file)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            # Découpage en chunks de 1000 caractères
            CHUNK_SIZE = 1000
            chunks = [
                full_text[i : i + CHUNK_SIZE]
                for i in range(0, len(full_text), CHUNK_SIZE)
            ]
            for idx, chunk_text in enumerate(chunks):
                db.add(DocumentChunk(
                    document_id=document.id,
                    chunk_text=chunk_text,
                    chunk_order=idx
                ))

        # On commit tous les chunks d’un coup
        await db.commit()
        

    return tender_folder
