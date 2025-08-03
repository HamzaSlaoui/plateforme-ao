from typing import List
from uuid import UUID

from fastapi import UploadFile
from schemas.tender_folder import TenderFolderCreate
from services.rag_service import rag_service
from repositories.tender_folder_repo import TenderFolderRepo
from repositories.document_repo import DocumentRepo
from models.tender_folder import TenderFolder
from models.document import Document
from sqlalchemy.ext.asyncio import AsyncSession

class TenderFolderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TenderFolderRepo(db)
        self.doc_repo = DocumentRepo(db)

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
            status=data.status,
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
                    document_type=f.filename.split(".")[-1].lower(),
                    uploaded_by=creator_id,
                    file_content=content,
                )
                await self.doc_repo.add(doc)
                await self.db.flush() 

                await rag_service.process_document(
                    db=self.db,
                    tender_folder_id=folder.id,
                    document_id=doc.id,
                    file_content=content,
                    file_type=doc.document_type,
                )

        await self.db.commit()
        await self.db.refresh(folder)
        return folder

    async def list_folders(self, org_id):
        return await self.repo.get_by_org(org_id)

    async def stats(self, org_id):
        raw = await self.repo.status_stats(org_id)
        base = {"en_cours": 0, "soumis": 0, "gagne": 0, "perdu": 0}
        base.update(raw)
        return base

    async def one_with_docs(self, folder_id, org_id):
        return await self.repo.get_with_docs(folder_id, org_id)
