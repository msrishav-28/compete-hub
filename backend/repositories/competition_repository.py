"""
Competition data access. All SQL lives here.
"""
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import asyncpg

from .base import record_to_dict, records_to_dicts

logger = logging.getLogger(__name__)


# Columns in the order we read / write them. Centralised so the SELECT
# projection and the upsert can't drift apart.
COMPETITION_COLUMNS: tuple[str, ...] = (
    "id", "title", "description", "category", "subcategory", "platform",
    "company", "start_date", "end_date", "registration_deadline",
    "duration_hours", "time_commitment", "difficulty", "skills_required",
    "team_size", "location", "prize", "link", "registration_link",
    "leaderboard_link", "tags", "recruitment_potential",
    "companies_recruiting", "portfolio_value", "source",
    "last_updated", "scraped_at",
)

_SELECT_ALL = f"SELECT {', '.join(COMPETITION_COLUMNS)} FROM competitions"


def _coerce_datetime(value: Any) -> Optional[datetime]:
    """
    Fetchers sometimes hand us naive datetimes or ISO strings. Postgres
    TIMESTAMPTZ wants tz-aware datetimes. Normalise everything to UTC.
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _prepare_competition_row(comp: dict[str, Any]) -> tuple:
    """
    Normalise a raw competition dict into the positional tuple the
    upsert statement expects. Missing values become NULL / defaults.
    """
    now = datetime.now(timezone.utc)
    prize = comp.get("prize")
    if isinstance(prize, dict):
        prize = json.dumps(prize)

    return (
        comp.get("id"),
        comp.get("title"),
        comp.get("description"),
        comp.get("category"),
        comp.get("subcategory"),
        comp.get("platform"),
        comp.get("company"),
        _coerce_datetime(comp.get("start_date")),
        _coerce_datetime(comp.get("end_date")),
        _coerce_datetime(comp.get("registration_deadline")),
        comp.get("duration_hours"),
        comp.get("time_commitment"),
        comp.get("difficulty"),
        list(comp.get("skills_required") or []),
        comp.get("team_size"),
        comp.get("location"),
        prize,
        comp.get("link"),
        comp.get("registration_link"),
        comp.get("leaderboard_link"),
        list(comp.get("tags") or []),
        bool(comp.get("recruitment_potential") or False),
        list(comp.get("companies_recruiting") or []),
        int(comp.get("portfolio_value") or 50),
        comp.get("source"),
        _coerce_datetime(comp.get("last_updated")) or now,
        _coerce_datetime(comp.get("scraped_at")) or now,
    )


# Pre-built upsert. The ON CONFLICT clause makes the operation idempotent:
# re-running the same fetcher never creates duplicates.
_UPSERT_SQL = f"""
INSERT INTO competitions ({', '.join(COMPETITION_COLUMNS)})
VALUES ({', '.join(f'${i+1}' for i in range(len(COMPETITION_COLUMNS)))})
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    platform = EXCLUDED.platform,
    company = EXCLUDED.company,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    registration_deadline = EXCLUDED.registration_deadline,
    duration_hours = EXCLUDED.duration_hours,
    time_commitment = EXCLUDED.time_commitment,
    difficulty = EXCLUDED.difficulty,
    skills_required = EXCLUDED.skills_required,
    team_size = EXCLUDED.team_size,
    location = EXCLUDED.location,
    prize = EXCLUDED.prize,
    link = EXCLUDED.link,
    registration_link = EXCLUDED.registration_link,
    leaderboard_link = EXCLUDED.leaderboard_link,
    tags = EXCLUDED.tags,
    recruitment_potential = EXCLUDED.recruitment_potential,
    companies_recruiting = EXCLUDED.companies_recruiting,
    portfolio_value = EXCLUDED.portfolio_value,
    source = EXCLUDED.source,
    last_updated = EXCLUDED.last_updated,
    scraped_at = EXCLUDED.scraped_at
"""


class CompetitionRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    # ---------- reads ----------

    async def get_by_id(self, competition_id: str) -> Optional[dict[str, Any]]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(f"{_SELECT_ALL} WHERE id = $1", competition_id)
        return record_to_dict(row)

    async def get_by_ids(self, ids: list[str]) -> list[dict[str, Any]]:
        if not ids:
            return []
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(f"{_SELECT_ALL} WHERE id = ANY($1::text[])", ids)
        return records_to_dicts(rows)

    async def get_filtered(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        time_commitment: Optional[str] = None,
        platform: Optional[str] = None,
        recruitment_only: bool = False,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Return (rows, total_count) for the given filters.
        Search uses Postgres full-text search (GIN-indexed), so user
        input is safe and never interpreted as regex.
        """
        clauses: list[str] = []
        args: list[Any] = []

        def add(clause: str, value: Any) -> None:
            args.append(value)
            clauses.append(clause.replace("?", f"${len(args)}"))

        if category:
            add("category = ?", category)
        if difficulty:
            add("difficulty = ?", difficulty)
        if time_commitment:
            add("time_commitment = ?", time_commitment)
        if platform:
            add("LOWER(platform) = LOWER(?)", platform)
        if recruitment_only:
            clauses.append("recruitment_potential = TRUE")
        if search:
            # plainto_tsquery treats input as plain text, immune to syntax injection
            add(
                "to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,'')) "
                "@@ plainto_tsquery('english', ?)",
                search,
            )

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        count_sql = f"SELECT COUNT(*) FROM competitions {where}"
        list_sql = (
            f"{_SELECT_ALL} {where} "
            f"ORDER BY start_date NULLS LAST, id "
            f"LIMIT ${len(args)+1} OFFSET ${len(args)+2}"
        )

        async with self.pool.acquire() as conn:
            total = await conn.fetchval(count_sql, *args)
            rows = await conn.fetch(list_sql, *args, limit, offset)
        return records_to_dicts(rows), int(total or 0)

    async def get_upcoming(
        self,
        days: int = 7,
        limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """Competitions starting in the next `days` days."""
        now = datetime.now(timezone.utc)
        end = now + timedelta(days=days)
        sql = f"{_SELECT_ALL} WHERE start_date BETWEEN $1 AND $2 ORDER BY start_date"
        args: list[Any] = [now, end]
        if limit:
            sql += f" LIMIT ${len(args)+1}"
            args.append(limit)
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *args)
        return records_to_dicts(rows)

    async def get_all(self, limit: Optional[int] = None) -> list[dict[str, Any]]:
        sql = f"{_SELECT_ALL} ORDER BY start_date NULLS LAST, id"
        args: list[Any] = []
        if limit:
            sql += f" LIMIT ${len(args)+1}"
            args.append(limit)
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *args)
        return records_to_dicts(rows)

    async def count_all(self) -> int:
        async with self.pool.acquire() as conn:
            value = await conn.fetchval("SELECT COUNT(*) FROM competitions")
        return int(value or 0)

    async def get_stats(self) -> dict[str, Any]:
        """
        Aggregate counts. Returned shape matches both the existing
        frontend's expectations (`total_competitions`, `by_category`,
        `by_difficulty`, `by_platform`) and the response schema
        (`total`, `categories`, `difficulties`, `platforms`).
        """
        async with self.pool.acquire() as conn:
            total = await conn.fetchval("SELECT COUNT(*) FROM competitions")
            cat_rows = await conn.fetch(
                "SELECT category, COUNT(*) AS n FROM competitions "
                "WHERE category IS NOT NULL GROUP BY category"
            )
            diff_rows = await conn.fetch(
                "SELECT difficulty, COUNT(*) AS n FROM competitions "
                "WHERE difficulty IS NOT NULL GROUP BY difficulty"
            )
            plat_rows = await conn.fetch(
                "SELECT platform, COUNT(*) AS n FROM competitions "
                "WHERE platform IS NOT NULL GROUP BY platform"
            )

        categories = {r["category"]: int(r["n"]) for r in cat_rows}
        difficulties = {r["difficulty"]: int(r["n"]) for r in diff_rows}
        platforms = {r["platform"]: int(r["n"]) for r in plat_rows}
        return {
            "total": int(total or 0),
            "total_competitions": int(total or 0),
            "categories": categories,
            "by_category": categories,
            "difficulties": difficulties,
            "by_difficulty": difficulties,
            "platforms": platforms,
            "by_platform": platforms,
        }

    # ---------- writes ----------

    async def upsert_many(self, competitions: list[Any]) -> int:
        """
        Bulk upsert in a single transaction. Returns the number of
        rows successfully written. Items without an id are skipped.
        """
        if not competitions:
            return 0

        rows: list[tuple] = []
        for c in competitions:
            if hasattr(c, "to_dict"):
                c = c.to_dict()
            if not isinstance(c, dict):
                continue
            if not c.get("id") or not c.get("title"):
                continue
            try:
                rows.append(_prepare_competition_row(c))
            except Exception as e:
                logger.warning("Skipping malformed competition %s: %s", c.get("id"), e)

        if not rows:
            return 0

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.executemany(_UPSERT_SQL, rows)
        return len(rows)
