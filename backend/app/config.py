from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()