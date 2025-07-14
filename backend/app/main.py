# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database import create_tables
from app.auth_routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Creating database tables...")
    await create_tables()
    print("Tables created successfully!")
    yield
    # Shutdown
    print("Application shutting down...")


app = FastAPI(
    title="Tender Management API",
    description="API pour la gestion des appels d'offres",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # En production, spécifiez les origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Tender Management API", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Pour le développement
    )