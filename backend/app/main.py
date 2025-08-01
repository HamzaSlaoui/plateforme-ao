from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn 

from db.session import create_tables #, drop_tables
from api.routers.auth import router as auth_router
from api.routers.organisation import router as organisations_routes
from api.routers.tender_folder import router as tender_folders_routes
from api.routers.chatbot import router as chatbot_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Creating database tables...")
    #await drop_tables() 
    await create_tables()
    print("Tables created successfully!")
    yield   
    print("Application shutting down...")


app = FastAPI(
    title="Tender Management API",
    description="API pour la gestion des appels d'offres",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organisations_routes)
app.include_router(tender_folders_routes)
app.include_router(chatbot_routes)


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