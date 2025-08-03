from fastapi.params import Depends
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

async def get_tf_service(db = Depends(get_db)) -> TenderFolderService:
    return TenderFolderService(db)

async def get_join_service(db=Depends(get_db)) -> OrganisationJoinService:
    return OrganisationJoinService(db)

async def get_org_member_service(db = Depends(get_db)) -> OrganisationMemberService:
    return OrganisationMemberService(db)