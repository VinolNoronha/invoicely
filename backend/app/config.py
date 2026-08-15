from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    USER_DEFAULT_GSTIN: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()