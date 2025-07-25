# auth.py
from datetime import datetime, timedelta, timezone # type: ignore
from typing import Optional # type: ignore
from jose import JWTError, jwt # type: ignore
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status # type: ignore
from fastapi.security import OAuth2PasswordBearer # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy import select # type: ignore
from sqlalchemy.orm import selectinload
from uuid import UUID

from api.deps import get_db
from models.user import User

from core.config import Config


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     to_encode["exp"] = expire
#     encoded_jwt = jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
#     return encoded_jwt

def create_access_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Génère un JWT de type 'access' avec :
      - sub: user_id
      - exp: expiration (par défaut Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": user_id,
        "exp": expire
        # Optionnel : ajouter "type": "access" si tu veux marquer explicitement
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.ALGORITHM)


def create_refresh_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=Config.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.ALGORITHM)



def create_verification_token(user_id: str) -> str:
    data = {
        "user_id": user_id,
        "type": "email_verification",
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.VERIFICATION_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(data, Config.SECRET_KEY, algorithm=Config.ALGORITHM)


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    """
    Decode un JWT et, si expected_type est précisé,
    vérifie que payload["type"] == expected_type.
    Mappe aussi payload["sub"] → payload["user_id"] pour l'accès utilisateur.
    """
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])

        # Vérification du type de token (si demandé)
        if expected_type and payload.get("type") != expected_type:
            return None

        # Mapping sub → user_id pour simplifier la lecture
        sub = payload.get("sub")
        if sub:
            payload["user_id"] = sub

        return payload

    except JWTError:
        return None



async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        user_id: str = payload.get("sub")  # type: ignore
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        # on precharge la relation organisation
        select(User)
        .options(selectinload(User.organisation))
        .where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


# async def get_current_verified_user(
#     current_user: User = Depends(get_current_user)
# ):
#     if not current_user.is_verified:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Email non verifié"
#         )
#     return current_user