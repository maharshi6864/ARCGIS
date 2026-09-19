from contextlib import asynccontextmanager
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config.settings import settings
from app.database.connection import engine, SessionLocal
from app.database.base import Base
# Import all models to ensure they are registered on Base.metadata
import app.models  # noqa: F401
from app.models.user import User
from app.models.det import Det
from app.models.vehicle_model import VehicleModel
from app.models.vehicle import Vehicle
from app.models.recovery import Recovery
from app.services.user_service import hash_password
from app.controllers.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    # 3. Ensure default 'admin' user exists with full rights
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@army.mil",
                full_name="System Administrator",
                hashed_password=hash_password("admin"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ Default admin user initialized (username: admin, password: admin)")

    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Military Tactical Detachment & Asset Management API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount master API router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "system": "Military Command & Asset Management System",
        "version": settings.VERSION,
        "docs": "/docs",
        "architecture": "MVC"
    }
