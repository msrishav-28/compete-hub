"""
FastAPI dependency injection functions.
Provides reusable dependencies for routes.
"""
from fastapi import Depends, HTTPException
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.database import get_database, is_connected


async def get_db() -> Optional[AsyncIOMotorDatabase]:
    """
    Dependency to get database instance.
    Use this for optional database access.
    """
    return get_database()


async def require_db() -> AsyncIOMotorDatabase:
    """
    Dependency that requires database connection.
    Raises 503 if database is not available.
    """
    if not is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Please try again later."
        )
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection lost. Please try again later."
        )
    
    return db
