from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport
from contextlib import asynccontextmanager
import uvicorn
import asyncio
import time
import functools
from typing import Dict, Any, Optional
import json
import logging
import hashlib
import aiofiles
import pickle
from pathlib import Path

from db.session import create_tables #, drop_tables
from api.routers.auth import router as auth_router
from api.routers.organisation import router as organisations_routes
from api.routers.tender_folder import router as tender_folders_routes
from api.routers.chat import router as chatbot_routes
from api.routers.marche import router as marche_routes

# Configuration du logging optimisée
logging.basicConfig(
    level=logging.WARNING,  # Moins de logs = plus de performance
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache ultra-rapide en mémoire avec différents TTL + cache persistant
cache: Dict[str, Dict[str, Any]] = {}
CACHE_FILE = Path("cache_snapshot.pkl")

# TTL spécifiques par type de route
CACHE_CONFIG = {
    "tender-folders": 300,     # 5 minutes pour les dossiers
    "pending-count": 30,       # 30 secondes pour les compteurs
    "wsn.session": 120,        # 2 minutes pour les sessions  
    "organisations": 300,      # 5 minutes pour les organisations
    "auth": 600,              # 10 minutes pour l'auth (plus long)
    "default": 60              # 1 minute par défaut
}

# Cache de préchauffage - données fréquemment demandées
WARMUP_ENDPOINTS = [
    "/organisations",
    "/tender-folders",
    "/health",
]

async def save_cache_snapshot():
    """Sauvegarde le cache sur disque de manière asynchrone"""
    try:
        # Nettoyer le cache avant de sauvegarder
        current_time = time.time()
        valid_cache = {}
        
        for key, entry in cache.items():
            cache_ttl = get_cache_ttl(entry.get("path", ""))
            if current_time - entry["timestamp"] < cache_ttl:
                valid_cache[key] = entry
        
        # Sauvegarder de manière asynchrone
        async with aiofiles.open(CACHE_FILE, 'wb') as f:
            await f.write(pickle.dumps(valid_cache))
        
        logger.info(f"Cache snapshot sauvegardé: {len(valid_cache)} entrées")
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du cache: {e}")

async def load_cache_snapshot():
    """Charge le cache depuis le disque au démarrage"""
    try:
        if CACHE_FILE.exists():
            async with aiofiles.open(CACHE_FILE, 'rb') as f:
                data = await f.read()
                loaded_cache = pickle.loads(data)
            
            # Vérifier que les entrées ne sont pas expirées
            current_time = time.time()
            valid_entries = 0
            
            for key, entry in loaded_cache.items():
                cache_ttl = get_cache_ttl(entry.get("path", ""))
                if current_time - entry["timestamp"] < cache_ttl:
                    cache[key] = entry
                    valid_entries += 1
            
            logger.info(f"Cache snapshot chargé: {valid_entries} entrées valides")
            return valid_entries > 0
    except Exception as e:
        logger.error(f"Erreur lors du chargement du cache: {e}")
    
    return False

def invalidate_cache_by_pattern(pattern: str):
    """Invalide toutes les entrées de cache contenant le pattern"""
    keys_to_delete = []
    for key, entry in cache.items():
        if pattern in entry.get("path", ""):
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        del cache[key]
    
    if keys_to_delete:
        logger.info(f"Cache invalidé: {len(keys_to_delete)} entrées pour pattern '{pattern}'")

def get_cache_key(request: Request) -> str:
    """Génère une clé de cache optimisée"""
    # Utiliser un hash pour des clés plus courtes
    path_params = f"{request.url.path}:{str(sorted(request.query_params.items()))}"
    return hashlib.md5(path_params.encode()).hexdigest()

def get_cache_ttl(path: str) -> int:
    """Détermine le TTL basé sur le chemin"""
    for route_type, ttl in CACHE_CONFIG.items():
        if route_type in path:
            return ttl
    return CACHE_CONFIG["default"]

def is_cache_valid(cache_entry: Dict[str, Any], ttl: int) -> bool:
    """Vérifie si l'entrée du cache est encore valide"""
    return time.time() - cache_entry["timestamp"] < ttl

class SmartCacheMiddleware: 
    """Middleware de cache intelligent avec optimisations"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            method = scope["method"]
            path = request.url.path
            
            # Invalidation automatique pour les méthodes de modification
            if method in ["POST", "PUT", "DELETE", "PATCH"]:
                # Invalider le cache selon la route modifiée
                if "tender-folders" in path or "tender_folders" in path:
                    invalidate_cache_by_pattern("tender-folder")
                elif "organisations" in path:
                    invalidate_cache_by_pattern("organisation")
                elif "marche" in path:
                    invalidate_cache_by_pattern("marche")
                elif "auth" in path:
                    invalidate_cache_by_pattern("auth")
            
            # Cache seulement pour les GET
            if method == "GET":
                cache_key = get_cache_key(request)
                cache_ttl = get_cache_ttl(path)
                
                # Vérifier le cache
                if cache_key in cache and is_cache_valid(cache[cache_key], cache_ttl):
                    cached_response = cache[cache_key]
                    
                    await send({
                        "type": "http.response.start",
                        "status": 200,
                        "headers": [
                            [b"content-type", b"application/json"],
                            [b"x-cache", b"HIT"],
                            [b"x-cache-age", str(int(time.time() - cached_response["timestamp"])).encode()],
                        ],
                    })
                    await send({
                        "type": "http.response.body",
                        "body": cached_response["body"],
                    })
                    return
                
                # Capturer la réponse pour la mettre en cache
                response_data = {"status": None, "headers": [], "body": b""}
                
                async def send_wrapper(message):
                    if message["type"] == "http.response.start":
                        response_data["status"] = message["status"]
                        response_data["headers"] = message["headers"]
                        response_data["headers"].append([b"x-cache", b"MISS"])
                    elif message["type"] == "http.response.body":
                        response_data["body"] += message.get("body", b"")
                        
                        if not message.get("more_body", False) and response_data["status"] == 200:
                            cache[cache_key] = {
                                "body": response_data["body"],
                                "timestamp": time.time(),
                                "path": path
                            }
                    
                    await send(message)
                
                await self.app(scope, receive, send_wrapper)
            else:
                await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)

class PerformanceMiddleware:
    """Middleware de monitoring ultra-léger"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.perf_counter()
            
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    process_time = time.perf_counter() - start_time
                    message["headers"].append(
                        (b"x-process-time", f"{process_time*1000:.1f}ms".encode())
                    )
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)


async def warmup_cache(app: FastAPI):
    """Préchauffe le cache avec les endpoints les plus utilisés"""
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            tasks = [client.get(endpoint) for endpoint in WARMUP_ENDPOINTS]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            success_count = sum(1 for r in responses if not isinstance(r, Exception))
            logger.info(f"Cache préchauffé: {success_count}/{len(tasks)} endpoints")
    except Exception as e:
        logger.warning(f"Erreur lors du préchauffage: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Démarrage de l'application...")
    
    # 1. Créer les tables de base de données
    logger.info("Création des tables...")
    await create_tables()
    logger.info("Tables créées avec succès!")
    
    # 2. Charger le cache depuis le snapshot
    logger.info("Chargement du cache snapshot...")
    cache_loaded = await load_cache_snapshot()
    
    # 3. Préchauffer le cache (seulement si pas de snapshot)
    if not cache_loaded:
        logger.info("Préchauffage du cache...")
        await warmup_cache(app)
    
    # 4. Tâche de nettoyage du cache
    async def cache_maintenance():
        while True:
            await asyncio.sleep(300)  # 5 minutes
            current_time = time.time()
            
            # Nettoyage par TTL spécifique
            expired_keys = []
            for key, entry in cache.items():
                cache_ttl = get_cache_ttl(entry.get("path", ""))
                if current_time - entry["timestamp"] > cache_ttl:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del cache[key]
            
            # Limiter la taille du cache (max 2000 entrées)
            if len(cache) > 2000:
                sorted_cache = sorted(cache.items(), key=lambda x: x[1]["timestamp"])
                for key, _ in sorted_cache[:200]:
                    del cache[key]
                logger.info("Cache size limit: 200 anciennes entrées supprimées")
            
            # Sauvegarder le snapshot toutes les 5 minutes
            await save_cache_snapshot()
    
    # 5. Tâche de sauvegarde périodique
    maintenance_task = asyncio.create_task(cache_maintenance())
    
    logger.info("Application prête - réponses optimisées dès le démarrage!")
    
    yield
    
    # Shutdown
    logger.info("Arrêt de l'application...")
    
    # Sauvegarder le cache avant l'arrêt
    await save_cache_snapshot()
    
    maintenance_task.cancel()
    try:
        await maintenance_task
    except asyncio.CancelledError:
        pass

# Application avec configuration optimisée
app = FastAPI(
    title="Tender Management API",
    description="API pour la gestion des appels d'offres - Optimisée",
    version="1.0.0",
    lifespan=lifespan,
    # Optimisations FastAPI
    docs_url="/docs" if __name__ == "__main__" else None,  # Désactiver en prod
    redoc_url=None,  # Désactiver redoc pour économiser les ressources
)

# Middlewares dans l'ordre optimal
app.add_middleware(PerformanceMiddleware)
app.add_middleware(SmartCacheMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(organisations_routes)
app.include_router(tender_folders_routes)
app.include_router(chatbot_routes)
app.include_router(marche_routes)

@app.get("/")
async def root():
    return {
        "message": "Tender Management API - Optimisée",
        "docs": "/docs",
        "cache_entries": len(cache),
        "status": "ready"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cache": {
            "entries": len(cache),
            "config": CACHE_CONFIG,
            "snapshot_exists": CACHE_FILE.exists()
        },
        "timestamp": int(time.time())
    }

# Endpoint pour forcer le préchauffage
@app.post("/admin/warmup-cache")
async def manual_warmup():
    """Endpoint pour forcer le préchauffage du cache"""
    await warmup_cache(app)
    return {"message": "Cache préchauffé", "entries": len(cache)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,
        access_log=False,
        log_level="warning",
        # Optimisations supplémentaires
        loop="asyncio",  # Loop optimisé
        http="httptools",  # Parser HTTP plus rapide
        ws="websockets",  # WebSocket optimisé
    )