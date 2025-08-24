from sqlalchemy import UUID, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.organization import Organization

class OrganizationRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def by_code(self, code: str) -> Organization | None:
        stmt = select(Organization).where(Organization.code == code)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def by_id(self, org_id: UUID) -> Organization | None:
        stmt = select(Organization).where(Organization.id == org_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def add(self, org: Organization):
        self.session.add(org)

    async def exists_code(self, code: str) -> bool:
        q = await self.session.scalar(
            select(func.count()).where(Organization.code == code)
        )
        return bool(q)
    
    async def exists(self, org_id: UUID) -> bool:
        stmt = select(Organization).where(Organization.id == org_id)
        return (await self.session.execute(stmt)).scalar_one_or_none() is not None
