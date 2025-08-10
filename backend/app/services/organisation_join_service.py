from uuid import UUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks, HTTPException, status

from repositories.organisation_join_request_repo import OrganisationJoinRequestRepo
from repositories.organisation_repo import OrganisationRepo
from repositories.user_repo import UserRepo
from models.organisation_join_request import OrganisationJoinRequest
from core.config import Config
from services.email_service import send_email

class OrganisationJoinService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.join_repo = OrganisationJoinRequestRepo(db)
        self.org_repo = OrganisationRepo(db)
        self.user_repo = UserRepo(db)

    async def request_join(
        self,
        user_id: UUID,
        code: str,
        bg: BackgroundTasks,
    ) -> None:
        if await self.join_repo.exists_pending_for_user(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà une demande en attente"
            )
        user = await self.user_repo.by_id(user_id)
        if user.organisation_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous appartenez déjà à une organisation"
            )

        org = await self.org_repo.by_code(code)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Code d'organisation invalide"
            )

        jr = OrganisationJoinRequest(
            user_id=user_id,
            organisation_id=org.id,
            status="en attente",
        )
        await self.join_repo.add(jr)

        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la création de la demande"
            )

        bg.add_task(
            send_email,
            to=user.email,
            subject="Demande d'adhésion envoyée",
            template_name="join_request_submitted.html",
            context={
                "firstname": user.firstname,
                "organisation_name": org.name,
                "code": org.code,
                "app_name": Config.APP_NAME,
            },
        )

        owner = await self.user_repo.find_owner(org.id)
        if owner:
            bg.add_task(
                send_email,
                to=owner.email,
                subject="Nouvelle demande d'adhésion",
                template_name="join_request_owner_alert.html",
                context={
                    "owner_firstname": owner.firstname,
                    "organisation_name": org.name,
                    "applicant_firstname": user.firstname,
                    "applicant_lastname": user.lastname,
                    "applicant_email": user.email,
                    "app_name": Config.APP_NAME,
                },
            )

    async def list_pending(self, org_id: UUID) -> list[dict]:
        if not await self.org_repo.exists(org_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation introuvable")
        return await self.join_repo.list_pending_by_org(org_id)
    
    async def count_pending(self, organisation_id: UUID) -> int:
        if not await self.org_repo.exists(organisation_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation introuvable")
        return await self.join_repo.count_pending(organisation_id)

    async def accept(self, request_id: UUID, owner_id: UUID, bg: BackgroundTasks) -> None:
        jr = await self.join_repo.get_by_id(request_id)
        if not jr or jr.organisation_id != (await self.user_repo.by_id(owner_id)).organisation_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
        if jr.status != "en attente":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande déjà traitée")

        await self.join_repo.cancel_pending_by_user(jr.user_id)

        jr.status = "accepte"
        user = await self.user_repo.by_id(jr.user_id)
        user.organisation_id = jr.organisation_id
        org = await self.org_repo.by_id(jr.organisation_id)
        try:
            await self.db.commit()
            bg.add_task(
                send_email,
                to=user.email,
                subject="Demande d'adhésion acceptée",
                template_name="join_request_accepted.html",
                context={
                    "firstname": user.firstname,
                    "organisation_name": org.name,
                    "app_name": Config.APP_NAME,
                },
            )
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Échec de l'acceptation")

    async def reject(self, request_id: UUID, owner_id: UUID, bg: BackgroundTasks) -> None:
        jr = await self.join_repo.get_by_id(request_id)
        if not jr or jr.organisation_id != (await self.user_repo.by_id(owner_id)).organisation_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
        if jr.status != "en attente":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande déjà traitée")

        jr.status = "rejetee"
        user = await self.user_repo.by_id(jr.user_id)
        org = await self.org_repo.by_id(jr.organisation_id)
        try:
            await self.db.commit()
            bg.add_task(
                send_email,
                to=user.email,
                subject="Demande d'adhésion rejetée",
                template_name="join_request_rejected.html",
                context={
                    "firstname": user.firstname,
                    "organisation_name": org.name,
                    "app_name": Config.APP_NAME,
                },
            )
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Échec du refus")
