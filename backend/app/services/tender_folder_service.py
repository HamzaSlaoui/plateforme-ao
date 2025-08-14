# services/tender_folder_service.py
from typing import List
from uuid import UUID

from fastapi import UploadFile
from schemas.tender_folder import TenderFolderCreate
from repositories.tender_folder_repo import TenderFolderRepo
from repositories.document_repo import DocumentRepo
from models.tender_folder import TenderFolder
from models.document import Document
from sqlalchemy.ext.asyncio import AsyncSession

class TenderFolderService:
    def __init__(self, db: AsyncSession, rag_service):
        self.db = db
        self.repo = TenderFolderRepo(db)
        self.doc_repo = DocumentRepo(db)
        self.rag_service = rag_service

    async def create_folder(
        self,
        *,
        data: TenderFolderCreate,                  
        creator_id: UUID,
        files: List[UploadFile] | None,
    ) -> TenderFolder:

        folder = TenderFolder(
            name=data.name,
            description=data.description,
            submission_deadline=data.submission_deadline,
            client_name=data.client_name,
            organisation_id=data.organisation_id,
            created_by=creator_id,
        )
        await self.repo.add(folder)
        await self.db.flush()      

        if files:
            for f in files:
                if not f.filename or f.size == 0:
                    continue
                content = await f.read()
                doc = Document(
                    tender_folder_id=folder.id,
                    filename=f.filename,
                    file_type=f.filename.split(".")[-1].lower(),
                    uploaded_by=creator_id,
                    file_content=content,
                )
                await self.doc_repo.add(doc)
                await self.db.flush() 

                await self.rag_service.process_document(  # Utilise self.rag_service
                    db=self.db,
                    tender_folder_id=folder.id,
                    document_id=doc.id,
                    file_content=content,
                    file_type=doc.file_type,
                )

        await self.db.commit()
        await self.db.refresh(folder)
        return folder

    async def delete(self, folder_id: UUID, org_id: UUID) -> bool:
        affected = await self.repo.delete(folder_id, org_id)
        await self.db.commit()
        return affected > 0

    async def list_folders_with_stats(self, org_id):
        # 1. Récupérer tous les dossiers
        folders = await self.repo.get_by_org(org_id) or []
        
        # 2. Calculer les stats en Python (plus rapide qu'une requête SQL séparée)
        stats = {"en_cours": 0, "soumis": 0, "gagne": 0, "perdu": 0}
        
        for folder in folders:
            if folder.status in stats:
                stats[folder.status] += 1
        
        return {
            "folders": folders,
            "stats": stats
        }

    async def one_with_docs(self, folder_id, org_id):
        return await self.repo.get_with_docs(folder_id, org_id)

    async def update_status(self, folder_id: UUID, org_id: UUID, status: str) -> bool:
        if status not in {"en_cours", "soumis", "gagne", "perdu"}:
            raise ValueError("Statut invalide")

        affected = await self.repo.update_status(folder_id, org_id, status)
        await self.db.commit()
        return affected > 0

    async def add_documents(
        self,
        *,
        folder_id: UUID,
        org_id: UUID,
        uploader_id: UUID,
        files: List[UploadFile],
    ) -> list[Document]:
        """
        Ajoute des documents à un dossier existant après vérification d'appartenance à l'organisation.
        """
        # Vérifier que le dossier existe et appartient à l'orga
        folder = await self.repo.get_with_docs(folder_id, org_id)
        if not folder:
            raise FileNotFoundError()

        created_docs: list[Document] = []

        for f in files:
            if not f.filename:
                continue
            content = await f.read()
            if not content:
                continue

            doc = Document(
                tender_folder_id=folder.id,
                filename=f.filename,
                file_type=f.filename.split(".")[-1].lower(),
                uploaded_by=uploader_id,
                file_content=content,
            )
            await self.doc_repo.add(doc)
            await self.db.flush()
            created_docs.append(doc)

            await self.rag_service.process_document(  # Utilise self.rag_service
                db=self.db,
                tender_folder_id=folder.id,
                document_id=doc.id,
                file_content=content,
                file_type=doc.file_type,
            )

        await self.db.commit()
        return created_docs