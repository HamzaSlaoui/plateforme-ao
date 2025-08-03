from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from repositories.user_repo import UserRepo
from repositories.organisation_repo import OrganisationRepo
from models.user import User

class OrganisationMemberService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepo(db)
        self.org_repo = OrganisationRepo(db)

    async def list_members(self, requester: User) -> list[User]:
        if not requester.is_owner or not requester.organisation_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        return await self.user_repo.list_by_organisation(requester.organisation_id)

    async def remove_member(self, requester: User, member_id: UUID) -> None:
        if not requester.is_owner or not requester.organisation_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

        if requester.id == member_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de vous retirer vous-même")

        member = await self.user_repo.by_id(member_id)
        if not member or member.organisation_id != requester.organisation_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membre non trouvé")

        await self.user_repo.dissociate_from_organisation(member)
        await self.db.commit()
