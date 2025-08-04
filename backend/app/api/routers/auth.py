from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, status, Response
from sqlalchemy import func, select 
from sqlalchemy.ext.asyncio import AsyncSession 
from api.deps import get_auth_service, get_org_service
from services.organisation_service import OrganisationService
from services.auth_service import AuthService
from schemas.organisation import OrganisationResponse
from core.security import get_current_user, get_current_verified_user
from db.session import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse
from schemas.auth import EmailVerification, Token 
from core.config import Config

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(
    data: UserCreate,
    bg: BackgroundTasks,
    auth: AuthService = Depends(get_auth_service),
):
    try:
        user, access_token = await auth.register(data, bg)

        return {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "is_verified": user.is_verified,
                "organisation_id": user.organisation_id
            }
        }
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.post("/login", response_model=Token)
async def login(
    form: UserLogin,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    try:
        access, refresh = await auth.login(form.email, form.password)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou mot de passe incorrect")

    response.set_cookie(
        "refresh_token", refresh,
        httponly=True, secure=not Config.DEBUG, samesite="lax",
        max_age=Config.REFRESH_TOKEN_EXPIRE_DAYS*24*3600,
        path="/"
    )
    return {"access_token": access, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/")
    return {"msg": "Déconnexion réussie"}


@router.post("/refresh", response_model=Token)
async def refresh(
    refresh_token: str | None = Cookie(None),
    auth: AuthService = Depends(get_auth_service)
):
    if not refresh_token:
        raise HTTPException(401, "refresh token manquant")
    try:
        new_access = await auth.refresh_access(refresh_token)
        return {"access_token": new_access, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(401, str(e))


@router.post("/verify-email")
async def verify_email(
    payload: EmailVerification,
    auth: AuthService = Depends(get_auth_service)
):
    try:
        await auth.verify_email(payload.token)
        return {"message": "Email vérifié avec succès"}
    except (ValueError, LookupError) as e:
        raise HTTPException(400, str(e))


@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    auth: AuthService = Depends(get_auth_service)
):
    try:
        await auth.resend_verification(current_user)
        return {
            "message": "Email de vérification renvoyé",
            "email": current_user.email,
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/me/organisation", response_model=OrganisationResponse)
async def get_my_organisation(
    current_user: User = Depends(get_current_verified_user),
    svc: OrganisationService = Depends(get_org_service),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.organisation_id:
        raise HTTPException(status_code=404, detail="Pas d'organisation")
    
    try:
        organisation = await svc.get_organisation_by_id(current_user.organisation_id, db)
        return OrganisationResponse(
            id=organisation.id,
            name=organisation.name,
            code=organisation.code,
            created_at=organisation.created_at,
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    