# main.py
from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from contextlib import asynccontextmanager # type: ignore
import uvicorn # type: ignore

from database import create_tables
from auth_routes import router as auth_router
from organisations_routes import router as organisations_routes


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router)
app.include_router(organisations_routes)


@app.get("/")
async def root():
    return {"message": "Tender Management API", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )