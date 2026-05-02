from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    gemini_api_key: str
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_from_name: str
    database_url: str = "sqlite:///../salesagent.db"
    backend_port: int = 8000

    @field_validator("gemini_api_key")
    @classmethod
    def gemini_key_must_not_be_placeholder(cls, v: str) -> str:
        if v.startswith("YOUR_") or v == "":
            raise ValueError(
                "GEMINI_API_KEY is not set. Get a key from "
                "https://aistudio.google.com/app/apikey and set it in .env"
            )
        return v

    @field_validator("smtp_password")
    @classmethod
    def smtp_password_must_not_be_placeholder(cls, v: str) -> str:
        if v.startswith("YOUR_") or v == "":
            raise ValueError("SMTP_PASSWORD is not set. Set a Gmail App Password in .env")
        return v

    model_config = {"env_file": "../.env"}

settings = Settings()
