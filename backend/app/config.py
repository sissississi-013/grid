from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://localhost/grid"
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str = ""
    bluebubbles_url: str = ""
    bluebubbles_password: str = ""
    slack_bot_token: str = ""
    slack_signing_secret: str = ""
    discord_bot_token: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()
