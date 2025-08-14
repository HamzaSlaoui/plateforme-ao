from fastapi.params import Depends
from core.config import Config
from services.rag_service import RAGService
from services.chat_service import ChatService
from db.session import get_db
from services.organisation_service import OrganisationService
from services.auth_service import AuthService
from services.tender_folder_service import TenderFolderService
from services.organisation_join_service import OrganisationJoinService
from services.organisation_member_service import OrganisationMemberService


async def get_org_service(db = Depends(get_db)) -> OrganisationService:
    return OrganisationService(db)

async def get_auth_service(db = Depends(get_db)) -> AuthService:
    return AuthService(db)

async def get_join_service(db=Depends(get_db)) -> OrganisationJoinService:
    return OrganisationJoinService(db)

async def get_org_member_service(db = Depends(get_db)) -> OrganisationMemberService:
    return OrganisationMemberService(db)

async def get_rag_service() -> RAGService:
    return RAGService(
        api_key=Config.OPENROUTER_API_KEY,
        base_url=Config.OPENROUTER_BASE_URL
    )

async def get_tf_service(
    db = Depends(get_db),
    rag_service: RAGService = Depends(get_rag_service)
) -> TenderFolderService:
    return TenderFolderService(db, rag_service)

async def get_chat_service(
    db = Depends(get_db),
    rag_service = Depends(get_rag_service)
) -> ChatService:
    return ChatService(db, rag_service)