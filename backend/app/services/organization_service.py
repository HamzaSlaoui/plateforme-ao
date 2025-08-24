import secrets, string
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from repositories.organization_join_request_repo import OrganizationJoinRequestRepo
from models.organization import Organization
from repositories.organization_repo import OrganizationRepo
from repositories.user_repo import UserRepo

class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.org_repo = OrganizationRepo(db)
        self.user_repo = UserRepo(db)
        self.join_repo = OrganizationJoinRequestRepo(db)
        self.db = db

    async def _generate_unique_code(self, length=8) -> str:
        alpha = string.ascii_uppercase + string.digits
        while True:
            code = "".join(secrets.choice(alpha) for _ in range(length))
            if not await self.org_repo.exists_code(code):
                return code

    async def create(self, name: str, owner_id: UUID) -> Organization:
        owner = await self.user_repo.by_id(owner_id)
        if not owner:
            raise ValueError("Utilisateur introuvable.")
        if owner.organization_id:
            raise ValueError("L'utilisateur appartient déjà à une organisation.")

        await self.join_repo.cancel_pending_by_user(owner_id)
        code = await self._generate_unique_code()
        org = Organization(name=name.strip(), code=code)
        await self.org_repo.add(org)

        await self.db.flush()

        owner.organization_id = org.id
        owner.is_owner = True

        try:
            await self.db.commit()
            await self.db.refresh(org)
            await self.db.refresh(owner)
            return org, owner
        except IntegrityError:
            await self.db.rollback()
            raise

    async def get_organization_by_id(self, org_id: UUID, db: AsyncSession) -> Organization:
        return await self.org_repo.by_id(org_id)
