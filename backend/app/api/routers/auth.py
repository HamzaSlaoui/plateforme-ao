from datetime import timedelta
from fastapi import APIRouter, Cookie, Depends, HTTPException, status, Response
from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession 
from uuid import UUID
from core.security import create_access_token, create_refresh_token, create_verification_token, get_current_user, get_password_hash, verify_password, verify_token
from services.email import send_verification_email
from db.session import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse
from schemas.auth import EmailVerification, Token 
from core.config import Config

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # 1) Rechercher l'utilisateur par email
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    if user:
        # 2) Si non vérifié, on autorise la mise à jour
        if not user.is_verified:
            # Mettre à jour les champs modifiables
            user.firstname     = user_data.firstname
            user.lastname      = user_data.lastname
            user.password_hash = get_password_hash(user_data.password)


            await db.commit()
            await db.refresh(user)

            # (Ré)envoi du mail de vérification
            token = create_verification_token(str(user.id))
            await send_verification_email(user.email, token)

            return user

        # 3) Si déjà vérifié, on bloque la réinscription
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte vérifié existe déjà avec cet email."
        )

    # 4) Email inconnu → création du nouvel utilisateur
    user = User(
        email         = user_data.email,
        firstname     = user_data.firstname,
        lastname      = user_data.lastname,
        password_hash = get_password_hash(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Envoi du mail de vérification
    token = create_verification_token(str(user.id))
    await send_verification_email(user.email, token)
    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    # Authentifier l'utilisateur
    result = await db.execute(
        select(User).where(User.email == form_data.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou Mot de passe incorrect"
        )
    
    # Créer le token
    access_token = create_access_token(str(user.id))

    refresh_token = create_refresh_token(str(user.id))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not Config.DEBUG,
        samesite="lax",
        max_age=Config.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    response: Response,
    refresh_token: str = Cookie(None),
):
    if not refresh_token:
        raise HTTPException(401, "refresh token manquant")

    payload = verify_token(refresh_token, expected_type="refresh")
    if not payload:
        raise HTTPException(401, "refresh token invalide ou expiré")

    user_id = payload["sub"]
    # (Optionnel) vérifier en base que ce refresh n’a pas été révoqué

    new_access = create_access_token(str(user_id))
    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/")
    return {"msg": "Déconnexion réussie"}



@router.post("/verify-email")
async def verify_email(
    data: EmailVerification,
    db: AsyncSession = Depends(get_db)
):
    payload = verify_token(data.token, "email_verification")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jeton invalide ou expiré"
        )
    
    # Mettre à jour l'utilisateur
    result = await db.execute(
        select(User).where(User.id == UUID(payload["user_id"]))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    
    user.is_verified = True
    await db.commit()
    
    return {"message": "Email verifié avec succès"}


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user



@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Renvoie l'email de vérification pour l'utilisateur connecté
    """
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Votre email est déjà vérifié, reconnectez vous"
        )
    
    # Créer un nouveau token
    verification_token = create_verification_token(str(current_user.id))
    
    try:
        await send_verification_email(current_user.email, verification_token)
        
        return {
            "message": "Email de vérification renvoyé avec succès",
            "email": current_user.email
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'envoi de l'email"
        )