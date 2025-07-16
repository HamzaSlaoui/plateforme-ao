from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from sqlalchemy import select # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from uuid import UUID

from auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, create_verification_token, get_current_user, get_password_hash, verify_password, verify_token
from database import get_db
from email_service import send_verification_email
from models import User
from schemas import EmailVerification, Token, UserCreate, UserLogin, UserResponse

from auth import oauth2_scheme 

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

            # (Optionnel) mettre à jour une date de dernière mise à jour
            # user.updated_at = datetime.utcnow()

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
    
    # # Bloquer l'accès si l'email n'a pas été vérifié
    # if not user.is_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Veuillez vérifier votre adresse email avant de vous connecter."
    #     )
    
    # Créer le token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

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
            detail="User not found"
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