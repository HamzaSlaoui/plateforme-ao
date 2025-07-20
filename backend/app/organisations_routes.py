from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from sqlalchemy import func, select # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore

from database import get_db
from schemas import OrganisationCreate, OrganisationResponse
from auth import get_current_user
from models import Organisation, User


router = APIRouter(prefix="/organisations", tags=["organisations"])

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
    
    new_organisation = Organisation(
        name=org_data.name.strip(),
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
            member_count=member_count or 1
        )
        
        return response
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de l'organisation"
        )
