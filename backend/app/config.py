from pydantic_settings import BaseSettings
import os
from pathlib import Path

# Get the path to the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    SECRET_KEY: str
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"

settings = Settings()