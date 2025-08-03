from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.tender_folder import TenderFolder

class TenderFolderRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add(self, folder: TenderFolder):
        self.db.add(folder)

    async def get_by_org(self, org_id):
        stmt = (
            select(TenderFolder)
            .options(selectinload(TenderFolder.documents))
            .where(TenderFolder.organisation_id == org_id)
        )
        return (await self.db.execute(stmt)).scalars().all()

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
