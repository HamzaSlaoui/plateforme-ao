from datetime import datetime, timedelta, timezone
import logging
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from api.deps import get_db
from models.user import User
from core.config import Config


pwd_context = CryptContext(schemes=["bcrypt"])
security = HTTPBearer()



def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(user_id: str, refresh: bool = False) -> str:
    if refresh:
        expiry = timedelta(days=Config.REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        expiry = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expiry
    payload = {
        "sub": user_id,
        "type": "refresh" if refresh else "access",
        "exp": expire
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.ALGORITHM)

def create_verification_token(user_id: str, purpose: str = "email_verification") -> str:
    payload = {
        "sub": user_id,
        "purpose": purpose,  # "email_verification" ou "password_reset"
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.VERIFICATION_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.ALGORITHM)


def verify_refresh_token(refresh_token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            refresh_token, 
            Config.SECRET_KEY, 
            algorithms=[Config.ALGORITHM]
        )
        
        # Vérifier que c'est bien un refresh token
        token_type = payload.get("type")
        if token_type != "refresh":
            logging.warning("Tentative d'utiliser un access token comme refresh token")
            return None
            
        return payload.get("sub")
        
    except jwt.ExpiredSignatureError:
        logging.info("Refresh token expiré")
        return None
    except JWTError as e:
        logging.error(f"Refresh token invalide: {e}")
        return None
    
    
def verify_verification_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        
        purpose = payload.get("purpose")
        if purpose != "email_verification":
            return None
            
        return payload.get("sub")  
        
    except jwt.ExpiredSignatureError:
        logging.error("Token de vérification expiré")
        return None
    except JWTError as e:
        logging.error(f"Token invalide: {e}")
        return None


# def verify_reset_token(token: str) -> Optional[str]:
#     try:
#         payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        
#         if payload.get("purpose") != "password_reset":
#             return None
            
#         return payload.get("sub")
        
#     except JWTError:
#         return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # D'abord, charger juste l'utilisateur sans l'organisation
    result = await db.execute(
        select(User).where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_verified_user(
    user: User = Depends(get_current_user)
) -> User:
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email non vérifié"
        )
    return user