from pydantic import BaseModel, ConfigDict, constr 
from uuid import UUID


class JoinOrgRequest(BaseModel):
    code: constr(strip_whitespace=True, min_length=8, max_length=8) # type: ignore


class JoinRequestResponse(BaseModel):
    id: UUID
    firstname: str
    lastname: str
    email: str

    model_config = ConfigDict(from_attributes=True)