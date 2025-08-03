from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession

from models.document import Document


class DocumentRepo:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def add(self, doc: Document) -> None:
        self.db.add(doc)


