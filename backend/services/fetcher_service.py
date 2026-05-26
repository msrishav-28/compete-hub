"""
Fetcher orchestration.

Fetchers are sync (use `requests`/`BeautifulSoup`), so we run each one
in a thread executor. Concurrency safety:

  - Per-source advisory lock (pg_try_advisory_lock) means if two
    requests trigger a refresh of the same source at the same time,
    only one actually scrapes. The other returns immediately as "in-progress".
  - Cross-process safety (multiple uvicorn/gunicorn workers) is also
    guaranteed by the advisory lock — it's a server-level lock, not
    process-level.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import asyncpg

from backend.repositories.competition_repository import CompetitionRepository

logger = logging.getLogger(__name__)

# Per-source hard ceiling. A scrape that exceeds this is treated as
# stuck rather than slow — better to emit a "timeout" status row than
# pin a worker.
_FETCH_TIMEOUT_SECONDS = 60


def _lock_key(source: str) -> int:
    """
    Map a source name to a stable 31-bit integer for pg_try_advisory_lock(int).

    NOTE: Python's built-in hash() randomizes string hashes per process,
    so two gunicorn workers would get DIFFERENT keys for the same source
    — defeating cross-worker safety. We use a stable hash instead.
    Collisions across our ~5 sources are vanishingly unlikely.
    """
    import hashlib
    digest = hashlib.blake2b(source.encode("utf-8"), digest_size=4).digest()
    return int.from_bytes(digest, "big") & 0x7FFFFFFF


class FetcherService:
    def __init__(self, pool: asyncpg.Pool, fetchers: dict[str, Any]):
        self.pool = pool
        self.fetchers = fetchers
        self.repo = CompetitionRepository(pool)

    # ---------- freshness ----------

    async def is_source_fresh(self, source: str, ttl_hours: int = 24) -> bool:
        async with self.pool.acquire() as conn:
            last = await conn.fetchval(
                "SELECT last_updated FROM fetcher_metadata WHERE source = $1",
                source,
            )
        if not last:
            return False
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) - last < timedelta(hours=ttl_hours)

    async def _update_metadata(
        self,
        source: str,
        *,
        count: int = 0,
        status: str = "ok",
    ) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO fetcher_metadata (source, last_updated, competition_count, last_status)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (source) DO UPDATE
                  SET last_updated = EXCLUDED.last_updated,
                      competition_count = EXCLUDED.competition_count,
                      last_status = EXCLUDED.last_status
                """,
                source, datetime.now(timezone.utc), count, status,
            )

    # ---------- one source ----------

    async def fetch_from_source(
        self,
        source: str,
        force: bool = False,
        ttl_hours: int = 24,
    ) -> dict[str, Any]:
        if source not in self.fetchers:
            return {"success": False, "source": source, "error": f"Unknown source: {source}"}

        if not force and await self.is_source_fresh(source, ttl_hours):
            return {"success": True, "source": source, "skipped": True, "message": "Data is still fresh"}

        # Hold the advisory lock for the duration of the scrape. If another
        # worker is already scraping this source, return immediately.
        key = _lock_key(source)
        async with self.pool.acquire() as conn:
            got_lock = await conn.fetchval("SELECT pg_try_advisory_lock($1)", key)
            if not got_lock:
                return {"success": True, "source": source, "skipped": True, "message": "Already in progress"}
            try:
                try:
                    fetcher = self.fetchers[source]
                    logger.info("Fetching from %s...", source)
                    if asyncio.iscoroutinefunction(fetcher.run):
                        competitions = await asyncio.wait_for(
                            fetcher.run(), timeout=_FETCH_TIMEOUT_SECONDS
                        )
                    else:
                        competitions = await asyncio.wait_for(
                            asyncio.get_event_loop().run_in_executor(None, fetcher.run),
                            timeout=_FETCH_TIMEOUT_SECONDS,
                        )

                    if not competitions:
                        await self._update_metadata(source, count=0, status="empty")
                        return {"success": True, "source": source, "count": 0, "message": "No competitions found"}

                    written = await self.repo.upsert_many(competitions)
                    await self._update_metadata(source, count=written, status="ok")
                    logger.info("Wrote %d competitions from %s", written, source)
                    return {"success": True, "source": source, "count": written, "message": f"Fetched {written} competitions"}
                except asyncio.TimeoutError:
                    logger.warning("Fetcher %s timed out after %ds", source, _FETCH_TIMEOUT_SECONDS)
                    await self._update_metadata(source, count=0, status="timeout")
                    return {"success": False, "source": source, "error": f"timeout after {_FETCH_TIMEOUT_SECONDS}s"}
                except Exception as e:
                    logger.exception("Fetcher %s failed", source)
                    await self._update_metadata(source, count=0, status=f"error: {e}")
                    return {"success": False, "source": source, "error": str(e)}
            finally:
                await conn.execute("SELECT pg_advisory_unlock($1)", key)

    # ---------- all sources ----------

    async def fetch_all_sources(
        self,
        force: bool = False,
        sources: Optional[list[str]] = None,
        ttl_hours: int = 24,
    ) -> dict[str, Any]:
        target = sources or list(self.fetchers.keys())
        results: dict[str, dict[str, Any]] = {}
        total = 0
        successes = 0
        for source in target:
            r = await self.fetch_from_source(source, force=force, ttl_hours=ttl_hours)
            results[source] = r
            if r.get("success"):
                successes += 1
                total += int(r.get("count", 0))
        return {
            "success": True,
            "sources_processed": len(target),
            "sources_successful": successes,
            "total_competitions": total,
            "details": results,
        }

    # ---------- status ----------

    async def get_source_status(self) -> dict[str, Any]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT source, last_updated, competition_count, last_status FROM fetcher_metadata"
            )
        by_source = {r["source"]: dict(r) for r in rows}

        status: dict[str, Any] = {}
        for source in self.fetchers.keys():
            md = by_source.get(source)
            fresh = await self.is_source_fresh(source) if md else False
            status[source] = {
                "is_fresh": fresh,
                "last_updated": md["last_updated"].isoformat() if md and md.get("last_updated") else None,
                "competition_count": int(md["competition_count"]) if md else 0,
                "last_status": md.get("last_status") if md else None,
            }
        return {"success": True, "sources": status}
