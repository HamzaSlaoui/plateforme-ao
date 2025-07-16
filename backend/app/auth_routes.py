from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, create_verification_token, get_current_user, get_password_hash, verify_password, verify_token
from app.database import get_db
from app.email_service import send_verification_email
from app.models import User
from app.schemas import EmailVerification, Token, UserCreate, UserLogin, UserResponse

from app.auth import oauth2_scheme 

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Vérifier si l'email existe
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    
    result_user = result.scalar_one_or_none()

    if result_user:
        if not result_user.is_verified:
            # Supprimer l'ancien utilisateur non vérifié
            await db.delete(result_user)
            await db.commit()
            
            # Créer le nouvel utilisateur
            user = User(
                email=user_data.email,
                firstname=user_data.firstname,
                lastname=user_data.lastname,
                password_hash=get_password_hash(user_data.password)
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Envoyer email de vérification
            verification_token = create_verification_token(str(user.id))
            await send_verification_email(user.email, verification_token)
            
            return user
        else:
            # L'utilisateur existe et est vérifié
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte vérifié existe déjà avec cet email"
            )
    
    # L'email n'existe pas, créer l'utilisateur
    user = User(
        email=user_data.email,
        firstname=user_data.firstname,
        lastname=user_data.lastname,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Envoyer email de vérification
    verification_token = create_verification_token(str(user.id))
    await send_verification_email(user.email, verification_token)
    
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
            detail="Votre email est déjà vérifié"
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