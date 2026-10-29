from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables via .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://spendwise:spendwise@localhost:5432/spendwise"
    jwt_secret_key: str = "a-very-long-and-secure-secret-key-for-development-only-32-chars!"
    jwt_expiration_minutes: int = 60
    environment: str = "development"


settings = Settings()