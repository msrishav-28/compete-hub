"""
Supabase Postgres connection management using asyncpg.

Single pool, shared across the process. Acquired per-request via
the get_pool() dependency. No global mutable state beyond _pool itself.
"""
import logging
from typing import Optional

import asyncpg

from backend.core.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def connect_to_db() -> bool:
    """
    Create the connection pool. Returns True on success, False if no
    DATABASE_URL is configured. Raises on any other failure so the
    operator sees the real error.
    """
    global _pool

    if not settings.database_url:
        logger.error("DATABASE_URL is not set; database is unavailable.")
        return False

    if _pool is not None:
        return True

    logger.info("Opening Postgres connection pool...")
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        command_timeout=settings.db_command_timeout,
        # Supabase pooler / pgbouncer compatibility:
        statement_cache_size=0,
    )

    # Sanity check.
    async with _pool.acquire() as conn:
        await conn.execute("SELECT 1")
    logger.info("Postgres pool ready (min=%d max=%d).",
                settings.db_pool_min_size, settings.db_pool_max_size)
    return True


async def close_db() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Postgres pool closed.")


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool


def is_connected() -> bool:
    return _pool is not None


async def ping() -> bool:
    """Verify the pool can serve a query right now. Used by /health."""
    if _pool is None:
        return False
    try:
        async with _pool.acquire() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.warning("DB ping failed: %s", e)
        return False
