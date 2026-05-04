from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://railsignal:railsignal@localhost:5432/railsignal"
    secret_key: str = "dev-secret-change-in-production"
    debug: bool = False

    model_config = SettingsConfigDict(env_file="../infra/.env", extra="ignore")


settings = Settings()
