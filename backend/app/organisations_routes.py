from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from database import get_db
from schemas import JoinOrgRequest, JoinRequestResponse, OrganisationCreate, OrganisationResponse
from auth import get_current_user
from models import Organisation, OrganisationJoinRequest, User

import secrets, string



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
async def register(
    org_data: OrganisationCreate,
    current_user: User = Depends(get_current_user),
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
    
    # Mettre à jour l'utilisateur
    current_user.organisation_id = new_organisation.id
    current_user.is_owner = True
    
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1️⃣ Vous ne pouvez pas faire plus d'une demande ou appartenir déjà
    if current_user.organisation_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous appartenez déjà à une organisation"
        )

    # 2️⃣ Éviter les demandes en double vers la même organisation
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

    # 3️⃣ Normalisation et recherche de l'organisation
    code = payload.code.strip().upper()
    org = (await db.execute(
        select(Organisation).where(Organisation.code == code)
    )).scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code d’organisation invalide"
        )

    # 4️⃣ Création de la demande sans lier immédiatement l’utilisateur
    join_req = OrganisationJoinRequest(
        user_id=current_user.id,
        organisation_id=org.id,
        status="pending"
    )
    db.add(join_req)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de la demande"
        )

    return {"message": "Votre demande a bien été envoyée au propriétaire de l’organisation"}

@router.get(
    "/join-requests",
    response_model=List[JoinRequestResponse],
    status_code=status.HTTP_200_OK,
)
async def list_join_requests(
    current_user: User = Depends(get_current_user),
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


@router.post(
    "/join-requests/{request_id}/accept",
    status_code=status.HTTP_200_OK,
)
async def accept_join_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check propriétaire
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    # Récupérer la demande
    join_req = await db.scalar(
        select(OrganisationJoinRequest)
        .where(OrganisationJoinRequest.id == request_id)
    )
    if not join_req or join_req.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande introuvable",
        )
    if join_req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette demande a déjà été traitée",
        )

    # Accepter : changer le status et lier l'utilisateur
    join_req.status = "accepte"
    user_to_accept = await db.scalar(
        select(User).where(User.id == join_req.user_id)
    )
    user_to_accept.organisation_id = current_user.organisation_id

    await db.commit()
    return {"message": "Utilisateur accepté dans l'organisation"}


@router.post(
    "/join-requests/{request_id}/reject",
    status_code=status.HTTP_200_OK,
)
async def reject_join_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check propriétaire
    if not current_user.is_owner or not current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    # Récupérer la demande
    join_req = await db.scalar(
        select(OrganisationJoinRequest)
        .where(OrganisationJoinRequest.id == request_id)
    )
    if not join_req or join_req.organisation_id != current_user.organisation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande introuvable",
        )
    if join_req.status != "en attente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette demande a déjà été traitée",
        )

    # Refuser : changer uniquement le status
    join_req.status = "refuse"
    await db.commit()
    return {"message": "Demande rejetée"}
