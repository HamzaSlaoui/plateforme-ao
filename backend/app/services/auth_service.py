from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from repositories.user_repo import UserRepo
from core.security import (
    create_access_token, create_verification_token,
    verify_password, get_password_hash, verify_refresh_token, verify_verification_token,
)
from services.email_service import send_verification_email

class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepo(db)
        self.db = db

    async def register(self, data, bg_tasks):
        user = await self.repo.by_email(data.email)

        if user and user.is_verified:
            raise ValueError("Compte déjà vérifié.")

        if user:               
            user.firstname = data.firstname
            user.lastname  = data.lastname
            user.password_hash = get_password_hash(data.password)
            
        else:                 
            user = User(
                email=data.email,
                firstname=data.firstname,
                lastname=data.lastname,
                password_hash=get_password_hash(data.password),
            )
        
            await self.repo.add(user)

        await self.db.commit()
        await self.db.refresh(user)

        token = create_verification_token(str(user.id))
        bg_tasks.add_task(send_verification_email, user.email, token)

        access_token = create_access_token(str(user.id))
        return user, access_token


    async def login(self, email, password):
        user = await self.repo.by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Identifiants invalides")

        access  = create_access_token(str(user.id))
        refresh = create_access_token(str(user.id), refresh=True)
        return access, refresh

    async def mark_verified(self, uid):
        user = await self.repo.by_id(uid)
        if not user:
            raise LookupError("Utilisateur introuvable")
        user.is_verified = True
        await self.db.commit()


    async def refresh_access(self, refresh_token: str) -> str:
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            raise ValueError("refresh token invalide ou expiré")
        return create_access_token(str(user_id))

    async def verify_email(self, token: str):
        user_id = verify_verification_token(token)
        if not user_id:
            raise ValueError("jeton invalide ou expiré")

        user = await self.repo.by_id(user_id)
        if not user:
            raise LookupError("Utilisateur introuvable")

        user.is_verified = True
        await self.db.commit()


    async def resend_verification(self, user: User):
        if user.is_verified:
            raise ValueError("Email déjà vérifié")

        token = create_verification_token(str(user.id))
        await send_verification_email(user.email, token)