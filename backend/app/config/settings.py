import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Defense & Detachment Asset Management API"
    VERSION: str = "2.0.0"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:admin@localhost:5432/ARCGIS"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
