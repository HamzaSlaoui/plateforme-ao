from typing import List
from typing import List
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from services.marche_service import MarcheService

router = APIRouter()

@router.get("/marches")
async def lancer_scraping(
    domaine: List[str] = Query(default=[]),  # 👈 accepte une liste# ✅ Ceci permet de recevoir ?domaine=abc&domaine=def
    reference: str = Query(default=""),
    acheteur: str = Query(default=""),
):
    service = MarcheService()
    resultats = await service.chercher_marches(domaine, reference, acheteur)
    return JSONResponse(content=jsonable_encoder(resultats))
