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
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # hardcoded for MVP

    model_config = {"env_file": "../.env"}

settings = Settings()
