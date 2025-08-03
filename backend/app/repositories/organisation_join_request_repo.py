from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.organisation_join_request import OrganisationJoinRequest
from models.user import User

class OrganisationJoinRequestRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def exists_pending_for_user(self, user_id: UUID) -> bool:
        stmt = select(OrganisationJoinRequest).where(
            OrganisationJoinRequest.user_id == user_id,
            OrganisationJoinRequest.status == "en attente",
        )
        return (await self.db.execute(stmt)).scalar_one_or_none() is not None

    async def add(self, join_req: OrganisationJoinRequest) -> None:
        self.db.add(join_req)

    async def get_by_id(self, request_id: UUID) -> Optional[OrganisationJoinRequest]:
        stmt = select(OrganisationJoinRequest).where(
            OrganisationJoinRequest.id == request_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def list_pending_by_org(self, org_id: UUID) -> List[dict]:
        stmt = (
            select(OrganisationJoinRequest, User)
            .join(User, OrganisationJoinRequest.user_id == User.id)
            .where(
                OrganisationJoinRequest.organisation_id == org_id,
                OrganisationJoinRequest.status == "en attente",
            )
        )
        rows = (await self.db.execute(stmt)).all()
        return [{"join": jr, "user": u} for jr, u in rows]
