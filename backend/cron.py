"""
CompeteHub cron entrypoint.

Designed to be invoked by Render's Cron Service (or any scheduler):

    python -m backend.cron refresh         # honours TTL — only re-scrapes stale sources
    python -m backend.cron refresh --force # forces all sources

The job opens the asyncpg pool, runs the same FetcherService used by
the API process, then closes the pool and exits. The per-source
advisory lock inside FetcherService keeps this safe if a /api/refresh
call happens to be in flight at the same moment.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from typing import Optional

from backend.core.config import settings
from backend.database import close_db, connect_to_db, get_pool


logger = logging.getLogger("competehub.cron")


async def _run_refresh(force: bool) -> int:
    try:
        connected = await connect_to_db()
    except Exception as e:
        logger.error("Failed to open DB pool: %s", e)
        return 2
    if not connected:
        logger.error("DATABASE_URL not configured; cannot run refresh.")
        return 2

    pool = get_pool()
    if pool is None:
        logger.error("DB pool not available after connect; aborting.")
        await close_db()
        return 2

    # Imports kept inside the function so the script can fail fast on
    # config errors (above) without touching fetchers (which import
    # heavy deps like requests/bs4).
    from backend.services.fetcher_service import FetcherService
    from backend.main import FETCHERS

    svc = FetcherService(pool, FETCHERS)
    try:
        result = await svc.fetch_all_sources(
            force=force,
            ttl_hours=settings.cache_ttl_hours,
        )
        logger.info(
            "refresh complete: %d/%d sources successful, %d total competitions.",
            result.get("sources_successful", 0),
            result.get("sources_processed", 0),
            result.get("total_competitions", 0),
        )
        # Emit a machine-readable summary to stdout so the Render cron
        # log is greppable.
        print(json.dumps(result, default=str))
        return 0
    finally:
        await close_db()


def main(argv: Optional[list[str]] = None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(prog="backend.cron")
    sub = parser.add_subparsers(dest="command", required=True)
    refresh = sub.add_parser("refresh", help="Re-fetch all sources")
    refresh.add_argument(
        "--force",
        action="store_true",
        help="Ignore freshness TTL and refresh every source",
    )

    args = parser.parse_args(argv)
    if args.command == "refresh":
        return asyncio.run(_run_refresh(force=args.force))
    parser.error(f"unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
