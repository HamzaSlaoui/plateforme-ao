from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "IntelliAO"
    DATABASE_URL : str

    ALGORITHM: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    VERIFICATION_TOKEN_EXPIRE_HOURS: int
    DEBUG: bool = False

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str

    FRONTEND_URL: str

    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str

    model_config = SettingsConfigDict(env_file=".env")
 

Config = Settings()


