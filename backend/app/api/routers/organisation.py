from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status # type: ignore
from sqlalchemy import func, select, update # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from typing import List
from uuid import UUID
from sqlalchemy.exc import IntegrityError
import secrets, string

from core.config import Config
from services.email import send_email
from core.security import get_current_verified_user

from db.session import get_db
from schemas.user import UserResponse
from schemas.organisation import OrganisationCreate, OrganisationResponse
from schemas.organisation_join_request import JoinOrgRequest, JoinRequestResponse
from models.organisation import Organisation
from models.organisation_join_request import OrganisationJoinRequest
from models.user import User


router = APIRouter(prefix="/organisations", tags=["organisations"])


async def generate_unique_code(session: AsyncSession, length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        candidate = "".join(secrets.choice(alphabet) for _ in range(length))
        exists = await session.scalar(
            select(func.count(Organisation.id))
            .where(Organisation.code == candidate)
        )
        if not exists:
            return candidate

@router.post("/create", response_model=OrganisationResponse)
async def create_organisation(
    org_data: OrganisationCreate,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    # Vérifier que l'utilisateur n'a pas déjà une organisation
    if current_user.organisation_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous appartenez déjà à une organisation"
        )
    
    code = await generate_unique_code(db)

    new_organisation = Organisation(
        name=org_data.name.strip(),
        code=code,
    )
        
    db.add(new_organisation)
    await db.flush()  # Pour obtenir l'ID
    
    # Mettre à jour l'utilisateurs
    await db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(
            organisation_id=new_organisation.id,
            is_owner=True
        )
    )
    
    try:
        await db.commit()
        await db.refresh(new_organisation)
        
        # Ajouter le nombre de membres pour la réponse
        member_count = await db.scalar(
            select(func.count(User.id))
            .where(User.organisation_id == new_organisation.id)
        )    
        
        response = OrganisationResponse(
            id=new_organisation.id,
            name=new_organisation.name,
            created_at=new_organisation.created_at,
            code=new_organisation.code,
            member_count=member_count or 1
        )
        
        return response
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de l'organisation"
        )


@router.post("/join", status_code=status.HTTP_202_ACCEPTED)
async def join_organisation(
    payload: JoinOrgRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.organisation_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous appartenez déjà à une organisation"
        )
    existing = await db.scalar(
        select(OrganisationJoinRequest)
        .where(
            OrganisationJoinRequest.user_id == current_user.id,
            OrganisationJoinRequest.status == "en attente"
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez déjà une demande en attente"
        )

    code = payload.code.strip().upper()
    org = (await db.execute(
        select(Organisation).where(Organisation.code == code)
    )).scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code d'organisation invalide"
        )

    join_req = OrganisationJoinRequest(
        user_id=current_user.id,
        organisation_id=org.id,
        status="pending"
    )
    db.add(join_req)

    try:
        await db.commit()
        
        background_tasks.add_task(
            send_email,
            to=current_user.email,
            subject="Demande d'adhésion envoyée",
            template_name="join_request_submitted.html",
            context={
                "firstname": current_user.firstname,
                "organisation_name": org.name,
                "code": org.code,
                "app_name": Config.APP_NAME,
            },
        )

        owner = await db.scalar(
            select(User).where(
                User.organisation_id == org.id,
                User.is_owner.is_(True),
            )
        )
        if owner:
            background_tasks.add_task(
                send_email,
                to=owner.email,
                subject="Nouvelle demande d'adhésion",
                template_name="join_request_owner_alert.html",
                context={
                    "owner_firstname": owner.firstname,
                    "app_name": Config.APP_NAME,
                    "organisation_name": org.name,
                    "applicant_firstname": current_user.firstname,
                    "applicant_lastname": current_user.lastname,
                    "applicant_email": current_user.email,
                },
            )

        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de la demande"
        )

    return {"message": "Votre demande a bien été envoyée au propriétaire de l'organisation"}

@router.get(
    "/join-requests",
    response_model=List[JoinRequestResponse],
    status_code=status.HTTP_200_OK,
)
async def list_join_requests(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    # Seul le propriétaire peut voir les demandes
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    # On va chercher toutes les demandes 'pending' pour son organisation
    result = await db.execute(
        select(OrganisationJoinRequest, User)
        .join(User, OrganisationJoinRequest.user_id == User.id)
        .where(
            OrganisationJoinRequest.organisation_id == current_user.organisation_id,
            OrganisationJoinRequest.status == "pending",
        )
    )

    # On retourne la liste des objets attendus par le front
    return [
        {
            "id": join_req.id,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "email": user.email,
        }
        for join_req, user in result.all()
    ]


@router.post("/join-requests/{request_id}/accept", status_code=status.HTTP_200_OK)
async def accept_join_request(
    request_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    join_req = await db.scalar(
        select(OrganisationJoinRequest).where(OrganisationJoinRequest.id == request_id)
    )
    if not join_req or join_req.organisation_id != current_user.organisation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    if join_req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande a déjà été traitée")

    join_req.status = "accepted"

    user_to_accept = await db.scalar(select(User).where(User.id == join_req.user_id))
    user_to_accept.organisation_id = current_user.organisation_id

    await db.commit()

    background_tasks.add_task(
        send_email,
        to=user_to_accept.email,
        subject="Votre demande a été acceptée",
        template_name="join_request_accepted.html",
        context={
            "firstname": user_to_accept.firstname,
            "organisation_name": current_user.organisation.name,
            "app_name": Config.APP_NAME,
        },
    )

    return {"message": "Utilisateur accepté dans l'organisation"}


@router.post("/join-requests/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_join_request(
    request_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    join_req = await db.scalar(
        select(OrganisationJoinRequest).where(OrganisationJoinRequest.id == request_id)
    )
    if not join_req or join_req.organisation_id != current_user.organisation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    if join_req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande a déjà été traitée")

    join_req.status = "rejected"

    user_to_reject = await db.scalar(select(User).where(User.id == join_req.user_id))
    await db.commit()

    background_tasks.add_task(
        send_email,
        to=user_to_reject.email,              
        subject="Votre demande a été refusée",
        template_name="join_request_rejected.html",
        context={
            "firstname": user_to_reject.firstname,
            "organisation_name": current_user.organisation.name,
            "app_name": Config.APP_NAME,
        },
    )

    return {"message": "Demande rejetée"}


@router.get("/members",response_model=List[UserResponse])
async def list_members(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    stmt = (
        select(User)
        .where(User.organisation_id == current_user.organisation_id)
    )
    result = await db.execute(stmt)
    members = result.scalars().all() 

    return members


@router.delete(
    "/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_member(
    member_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    # Vérifier que le membre appartient à la même org
    stmt = select(User).where(
        User.id == member_id,
        User.organisation_id == current_user.organisation_id,
    )
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre non trouvé",
        )

    # Dissocier
    member.organisation_id = None
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
