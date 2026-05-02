from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    gemini_api_key: str | None = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_name: str | None = None
    database_url: str = "sqlite:///../salesagent.db"
    backend_port: int = 8000
    secret_key: str  # REQUIRED — must be set via SECRET_KEY in .env (generate with: openssl rand -hex 32)

    model_config = {"env_file": "../.env"}

settings = Settings()
