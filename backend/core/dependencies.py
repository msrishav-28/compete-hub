"""
FastAPI dependency-injection helpers.
"""
from typing import Optional

import asyncpg
from fastapi import Header, HTTPException, Query, status

from backend.database import get_pool, is_connected


async def get_db_pool() -> asyncpg.Pool:
    """
    Returns the live asyncpg pool, or raises 503 if the database is unavailable.
    Use this in every route that needs the DB.
    """
    pool = get_pool()
    if pool is None or not is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please try again later.",
        )
    return pool


def get_current_user_id(
    user_id: str = Query(default="default_user", max_length=100, min_length=1),
) -> str:
    """
    Resolve the calling user. For now this trusts the ?user_id= query param
    (matching the existing frontend). When real auth lands, replace the body
    of this function with JWT verification — every route already depends on it.
    """
    return user_id


async def require_admin(
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> None:
    """
    Gate sensitive endpoints (e.g. /api/refresh) behind a shared ADMIN_KEY.
    Header: X-Admin-Key: <value>
    """
    # Defer the import so config errors surface clearly.
    from backend.core.config import settings
    if not settings.admin_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin endpoint is disabled (ADMIN_KEY not configured).",
        )
    if not x_admin_key or x_admin_key != settings.admin_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin key.",
        )
