"""
Application configuration using Pydantic Settings.
Single source of truth for all configuration values.
"""
import os
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # Database
    mongodb_url: Optional[str] = Field(default=None, env="MONGODB_URL")
    db_name: str = Field(default="competehub", env="DB_NAME")
    
    # MongoDB connection pool settings
    mongo_max_pool_size: int = Field(default=50, env="MONGO_MAX_POOL_SIZE")
    mongo_min_pool_size: int = Field(default=10, env="MONGO_MIN_POOL_SIZE")
    mongo_server_selection_timeout_ms: int = Field(default=5000)
    mongo_connect_timeout_ms: int = Field(default=10000)
    mongo_socket_timeout_ms: int = Field(default=30000)
    
    # CORS
    cors_origins: str = Field(default="http://localhost:3000", env="CORS_ORIGINS")
    
    # API Settings
    api_title: str = "CompeteHub API"
    api_version: str = "2.0.0"
    api_description: str = "Comprehensive API for discovering, tracking, and analyzing competitions"
    
    # Cache settings
    cache_ttl_hours: int = Field(default=24, env="CACHE_TTL_HOURS")
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window_seconds: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        
        # Add localhost variations in development
        if self.is_development:
            dev_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
            origins.extend([o for o in dev_origins if o not in origins])
        
        return origins
    
    @property
    def mongo_options(self) -> dict:
        """Get MongoDB connection options."""
        return {
            "serverSelectionTimeoutMS": self.mongo_server_selection_timeout_ms,
            "connectTimeoutMS": self.mongo_connect_timeout_ms,
            "socketTimeoutMS": self.mongo_socket_timeout_ms,
            "maxPoolSize": self.mongo_max_pool_size,
            "minPoolSize": self.mongo_min_pool_size,
            "retryWrites": True,
            "retryReads": True,
        }
    
    @validator("mongodb_url", pre=True)
    def validate_mongodb_url(cls, v):
        if v and ("<password>" in v or "<username>" in v):
            raise ValueError("MongoDB URL contains unreplaced placeholders")
        if v and "cluster0.example.mongodb.net" in v:
            raise ValueError("MongoDB URL contains placeholder value")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()


# Global settings instance
settings = get_settings()
