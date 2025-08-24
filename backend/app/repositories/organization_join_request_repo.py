from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.organization_join_request import OrganizationJoinRequest
from models.user import User

class OrganizationJoinRequestRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def exists_pending_for_user(self, user_id: UUID) -> bool:
        stmt = select(OrganizationJoinRequest).where(
            OrganizationJoinRequest.user_id == user_id,
            OrganizationJoinRequest.status == "en attente",
        )
        return (await self.db.execute(stmt)).scalar_one_or_none() is not None
    
    async def cancel_pending_by_user(self, user_id: UUID):
        await self.db.execute(
            update(OrganizationJoinRequest)
              .where(OrganizationJoinRequest.user_id == user_id,
                     OrganizationJoinRequest.status == "en attente")
              .values(status="annulee")
        )

    async def add(self, join_req: OrganizationJoinRequest) -> None:
        self.db.add(join_req)

    async def get_by_id(self, request_id: UUID) -> Optional[OrganizationJoinRequest]:
        stmt = select(OrganizationJoinRequest).where(
            OrganizationJoinRequest.id == request_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def list_pending_by_org(self, org_id: UUID) -> List[dict]:
        stmt = (
            select(OrganizationJoinRequest, User)
            .join(User, OrganizationJoinRequest.user_id == User.id)
            .where(
                OrganizationJoinRequest.organization_id == org_id,
                OrganizationJoinRequest.status == "en attente",
            )
        )
        rows = (await self.db.execute(stmt)).all()
        return [{"join": jr, "user": u} for jr, u in rows]
    
    async def count_pending(self, org_id: UUID) -> int:
        stmt = select(func.count(OrganizationJoinRequest.id)).where(
            OrganizationJoinRequest.organization_id == org_id,
            OrganizationJoinRequest.status == "en attente",
        )
        return (await self.db.execute(stmt)).scalar() or 0
