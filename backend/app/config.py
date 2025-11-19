from pydantic_settings import BaseSettings
import os
from pathlib import Path
from typing import Optional

# Get the path to the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    SECRET_KEY: str
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour (security best practice)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days (reduced from 90 for better security)
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production

    # Database connection pool settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Rate limiting settings
    MAX_PENDING_TRAINING_REQUESTS: int = 10

    # Admin settings
    ADMIN_SECRET_KEY: str  # Secret key for creating the first admin user

    # Twilio settings
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_VERIFY_SERVICE_SID: str

    # Twilio API Keys (optional - recommended for production)
    # If provided, these will be used instead of Account SID/Auth Token
    TWILIO_API_SID: Optional[str] = None
    TWILIO_API_SECRET: Optional[str] = None

    # Supabase settings for file storage
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service role key
    SUPABASE_BUCKET: str = "profile-photos"

    # File upload settings
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB in bytes
    ALLOWED_IMAGE_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_MIME_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]

    # CORS settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"

settings = Settings()