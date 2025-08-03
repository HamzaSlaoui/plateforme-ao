from sqlalchemy import UUID, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.organisation import Organisation

class OrganisationRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def by_code(self, code: str) -> Organisation | None:
        stmt = select(Organisation).where(Organisation.code == code)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def add(self, org: Organisation):
        self.session.add(org)

    async def exists_code(self, code: str) -> bool:
        q = await self.session.scalar(
            select(func.count()).where(Organisation.code == code)
        )
        return bool(q)
    
    async def exists(self, org_id: UUID) -> bool:
        stmt = select(Organisation).where(Organisation.id == org_id)
        return (await self.session.execute(stmt)).scalar_one_or_none() is not None
