from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status 
from typing import List
from uuid import UUID
from api.deps import get_join_service, get_org_member_service, get_org_service
from services.organization_member_service import OrganizationMemberService
from services.organization_join_service import OrganizationJoinService
from services.organization_service import OrganizationService
from core.security import get_current_verified_user
from schemas.user import UserResponse
from schemas.organization import OrganizationCreate, OrganizationCreateResponse, OrganizationResponse
from schemas.organization_join_request import JoinOrgRequest, JoinRequestResponse
from models.user import User


router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("/create", response_model=OrganizationCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user = Depends(get_current_verified_user),
    org_srv: OrganizationService = Depends(get_org_service),
):
    try:
        org, updated_user = await org_srv.create(org_data.name, current_user.id)
        return OrganizationCreateResponse(
            organization=OrganizationResponse.model_validate(org),
            user=UserResponse.model_validate(updated_user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/join", status_code=status.HTTP_202_ACCEPTED)
async def join_organization(
    payload: JoinOrgRequest,
    bg: BackgroundTasks,
    current_user=Depends(get_current_verified_user),
    svc: OrganizationJoinService = Depends(get_join_service),
):
    await svc.request_join(current_user.id, payload.code.strip().upper(), bg)
    return {"message": "Votre demande a bien été envoyée"}


@router.get(
    "/join-requests",
    response_model=List[JoinRequestResponse],
    status_code=status.HTTP_200_OK,
)
async def list_join_requests(
    current_user=Depends(get_current_verified_user),
    svc: OrganizationJoinService = Depends(get_join_service),
):
    if not current_user.is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    raw = await svc.list_pending(current_user.organization_id)
    print(raw)
    return [
        JoinRequestResponse(
            id=jr["join"].id,
            firstname=jr["user"].firstname,
            lastname=jr["user"].lastname,
            email=jr["user"].email,
        )
        for jr in raw
    ]

@router.get("/join-requests/pending-count", status_code=status.HTTP_200_OK)
async def get_pending_requests_count(
    current_user=Depends(get_current_verified_user),
    svc: OrganizationJoinService = Depends(get_join_service),
):
    if not current_user.is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    count = await svc.count_pending(current_user.organization_id)
    return {"count": count}


@router.post("/join-requests/{request_id}/accept", status_code=status.HTTP_200_OK)
async def accept_join_request(
    request_id: UUID,
    bg: BackgroundTasks,
    current_user=Depends(get_current_verified_user),
    svc: OrganizationJoinService = Depends(get_join_service),
):
    if not current_user.is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    await svc.accept(request_id, current_user.id, bg)
    return {"message": "Utilisateur accepté dans l'organisation"}


@router.post("/join-requests/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_join_request(
    request_id: UUID,
    bg: BackgroundTasks,
    current_user=Depends(get_current_verified_user),
    svc: OrganizationJoinService = Depends(get_join_service),
):
    if not current_user.is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    await svc.reject(request_id, current_user.id, bg)
    return {"message": "Demande rejetée"}


@router.get("/members", response_model=List[UserResponse])
async def list_members(
    current_user: User = Depends(get_current_verified_user),
    svc: OrganizationMemberService = Depends(get_org_member_service),
):
    members = await svc.list_members(current_user)
    return [UserResponse.model_validate(m) for m in members]

@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: UUID,
    current_user: User = Depends(get_current_verified_user),
    svc: OrganizationMemberService = Depends(get_org_member_service),
):
    if not current_user.is_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    await svc.remove_member(current_user, member_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
