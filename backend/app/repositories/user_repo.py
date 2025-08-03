from typing import List, Optional
from sqlalchemy import UUID, select
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User

class UserRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def by_email(self, email: str) -> User | None:
        return (await self.db.execute(
            select(User).where(User.email == email)
        )).scalar_one_or_none()

    async def by_id(self, uid) -> User | None:
        return (await self.db.execute(
            select(User).where(User.id == uid)
        )).scalar_one_or_none()

    async def add(self, user: User) -> None:
        self.db.add(user)

    async def find_owner(self, organisation_id: UUID) -> Optional[User]:
        stmt = select(User).where(
            User.organisation_id == organisation_id,
            User.is_owner.is_(True),
        ).limit(1)
        return (await self.db.execute(stmt)).scalar_one_or_none()
    
    async def list_by_organisation(self, organisation_id: UUID) -> List[User]:
        stmt = select(User).where(User.organisation_id == organisation_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def dissociate_from_organisation(self, user: User) -> None:
        user.organisation_id = None
