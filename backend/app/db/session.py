from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker # type: ignore
from sqlalchemy.pool import NullPool # type: ignore
from typing import AsyncGenerator
from db.base import Base
from core.config import Config


# Création du moteur async
engine = create_async_engine(
    url=Config.DATABASE_URL,
    echo=True,  # Mettre False en production
    poolclass=NullPool,  # Recommandé pour asyncpg
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Dependency pour FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Fonction pour créer les tables
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Fonction pour supprimer les tables
async def drop_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)