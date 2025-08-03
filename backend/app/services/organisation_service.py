import secrets, string
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from models.organisation import Organisation
from repositories.organisation_repo import OrganisationRepo
from repositories.user_repo import UserRepo

class OrganisationService:
    def __init__(self, db: AsyncSession):
        self.org_repo = OrganisationRepo(db)
        self.user_repo = UserRepo(db)
        self.db = db

    async def _generate_unique_code(self, length=8) -> str:
        alpha = string.ascii_uppercase + string.digits
        while True:
            code = "".join(secrets.choice(alpha) for _ in range(length))
            if not await self.org_repo.exists_code(code):
                return code

    async def create(self, name: str, owner_id: UUID) -> Organisation:
        owner = await self.user_repo.by_id(owner_id)
        if not owner:
            raise ValueError("Utilisateur introuvable.")
        if owner.organisation_id:
            raise ValueError("L'utilisateur appartient déjà à une organisation.")

        code = await self._generate_unique_code()
        org = Organisation(name=name.strip(), code=code)
        await self.org_repo.add(org)

        await self.db.flush()

        owner.organisation_id = org.id
        owner.is_owner = True

        try:
            await self.db.commit()
            await self.db.refresh(org)
            return org
        except IntegrityError:
            await self.db.rollback()
            raise
