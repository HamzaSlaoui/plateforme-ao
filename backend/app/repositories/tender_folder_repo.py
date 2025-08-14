from sqlalchemy import UUID, delete, desc, select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.document import Document
from models.tender_folder import TenderFolder

class TenderFolderRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add(self, folder: TenderFolder):
        self.db.add(folder)

    async def delete(self, folder_id: UUID, org_id: UUID) -> int:
        stmt = (
            delete(TenderFolder)
            .where(
                TenderFolder.id == folder_id,
                TenderFolder.organisation_id == org_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.rowcount or 0


    async def get_by_org_with_doc_counts(self, org_id):
        doc_count_sq = (
            select(
                Document.tender_folder_id.label("folder_id"),
                func.count(Document.id).label("document_count"),
            )
            .group_by(Document.tender_folder_id)
            .subquery()
        )

        stmt = (
            select(
                TenderFolder,
                func.coalesce(doc_count_sq.c.document_count, 0).label("document_count"),
            )
            .outerjoin(doc_count_sq, TenderFolder.id == doc_count_sq.c.folder_id)
            .where(TenderFolder.organisation_id == org_id)
        )

        result = await self.db.execute(stmt)
        rows = result.all()
        folders = []
        for folder, count in rows:
            setattr(folder, "document_count", int(count))
            folders.append(folder)
        return folders

    async def get(self, folder_id: int):
        stmt = (
            select(TenderFolder)
            .where(TenderFolder.id == folder_id)
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_with_docs(self, folder_id, org_id):
        stmt = (
            select(TenderFolder)
            .options(selectinload(TenderFolder.documents))
            .where(
                TenderFolder.id == folder_id,
                TenderFolder.organisation_id == org_id,
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def status_stats(self, org_id):
        stmt = (
            select(TenderFolder.status, func.count())
            .where(TenderFolder.organisation_id == org_id)
            .group_by(TenderFolder.status)
        )
        return dict((await self.db.execute(stmt)).all())

    async def update_status(self, folder_id: UUID, org_id: UUID, status: str) -> int:
        stmt = (
            update(TenderFolder)
            .where(
                TenderFolder.id == folder_id,
                TenderFolder.organisation_id == org_id,
            )
            .values(status=status)
        )
        result = await self.db.execute(stmt)
        return result.rowcount or 0
