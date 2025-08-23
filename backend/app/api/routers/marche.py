from typing import List
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from services.marche_service import MarcheService

router = APIRouter()

@router.get("/marches")
async def lancer_scraping_complet(
    domaine: List[str] = Query(default=[]),
    reference: str = Query(default=""),
    acheteur: str = Query(default=""),
):
    """
    Endpoint pour rechercher et récupérer TOUS les marchés publics correspondant aux critères
    
    Args:
        domaine: Liste des domaines d'activité
        reference: Référence du marché
        acheteur: Nom de l'acheteur public
    
    Returns:
        JSON: Liste complète de tous les marchés
    """
    service = MarcheService()
    
    resultats = await service.chercher_marches_complet(
        domaines=domaine,
        reference=reference, 
        acheteur=acheteur
    )
    
    return JSONResponse(content=jsonable_encoder(resultats))


@router.get("/marches/simple")  
async def lancer_scraping_simple(
    domaine: List[str] = Query(default=[]),
    reference: str = Query(default=""),
    acheteur: str = Query(default=""),
):
    """
    Endpoint simple pour récupérer seulement la première page
    """
    service = MarcheService()
    resultats = await service.chercher_marches_simple(domaine, reference, acheteur)
    return JSONResponse(content=jsonable_encoder(resultats))