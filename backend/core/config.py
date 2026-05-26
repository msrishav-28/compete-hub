"""
Application configuration using Pydantic Settings.
Single source of truth for all configuration values.
"""
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    # Environment
    environment: str = Field(default="development")
    debug: bool = Field(default=False)

    # Database (Supabase Postgres direct connection string)
    # postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
    database_url: Optional[str] = Field(default=None)

    # Connection pool
    db_pool_min_size: int = Field(default=2)
    db_pool_max_size: int = Field(default=10)
    db_command_timeout: int = Field(default=30)

    # CORS
    cors_origins: str = Field(default="http://localhost:3000")

    # API
    api_title: str = "CompeteHub API"
    api_version: str = "2.1.0"
    api_description: str = "Discover, track, and analyze engineering competitions."

    # Cache TTL for fetcher data
    cache_ttl_hours: int = Field(default=24)

    # Rate limiting (per-IP, per-window)
    rate_limit_per_minute: int = Field(default=60)
    rate_limit_refresh_per_hour: int = Field(default=5)

    # Admin key required to trigger /api/refresh.
    # If unset in production we refuse the call rather than leave it open.
    admin_key: Optional[str] = Field(default=None)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if self.is_development:
            for dev in ("http://localhost:3000", "http://127.0.0.1:3000",
                        "http://localhost:5173", "http://127.0.0.1:5173"):
                if dev not in origins:
                    origins.append(dev)
        return origins

    @field_validator("database_url")
    @classmethod
    def _check_db_url(cls, v: Optional[str]) -> Optional[str]:
        if v and ("<password>" in v or "<project>" in v):
            raise ValueError("DATABASE_URL still contains placeholder values")
        return v

    @field_validator("cors_origins")
    @classmethod
    def _check_cors(cls, v: str) -> str:
        # Reject wildcard — we use allow_credentials=True which is unsafe with "*"
        if v.strip() == "*":
            raise ValueError("CORS_ORIGINS='*' is unsafe with credentials. List explicit origins.")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
