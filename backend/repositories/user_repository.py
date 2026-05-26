"""
User data access. The 'user' is composed across four tables:
  users, saved_competitions, competition_entries, competition_wins
"""
import json
import logging
from typing import Any, Optional

import asyncpg

from .base import coalesce_updates, record_to_dict, records_to_dicts

logger = logging.getLogger(__name__)


USER_COLUMNS: tuple[str, ...] = (
    "user_id", "name", "email", "college", "year",
    "specializations", "skill_levels", "linked_profiles",
    "difficulty_preference", "time_available_weekly",
    "preferred_categories", "goals", "created_at", "updated_at",
)
_SELECT_USER = f"SELECT {', '.join(USER_COLUMNS)} FROM users"


# Columns that are safe to set via the public profile-update endpoint.
# Anything not in this allowlist (e.g. created_at) is ignored.
_UPDATABLE_USER_FIELDS: frozenset[str] = frozenset({
    "name", "email", "college", "year",
    "specializations", "skill_levels", "linked_profiles",
    "difficulty_preference", "time_available_weekly",
    "preferred_categories", "goals",
})


def _hydrate_user(row: asyncpg.Record | None) -> Optional[dict[str, Any]]:
    """Convert a users row, parsing JSONB columns back into dicts."""
    if row is None:
        return None
    d = dict(row)
    for jsonb_col in ("skill_levels", "linked_profiles"):
        v = d.get(jsonb_col)
        if isinstance(v, str):
            try:
                d[jsonb_col] = json.loads(v)
            except (TypeError, ValueError):
                d[jsonb_col] = {}
        elif v is None:
            d[jsonb_col] = {}
    for arr_col in ("specializations", "preferred_categories", "goals"):
        if d.get(arr_col) is None:
            d[arr_col] = []
    return d


class UserRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    # ---------- profile ----------

    async def get_by_user_id(self, user_id: str) -> Optional[dict[str, Any]]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(f"{_SELECT_USER} WHERE user_id = $1", user_id)
        return _hydrate_user(row)

    async def get_or_create(self, user_id: str) -> dict[str, Any]:
        """
        Atomic get-or-create. INSERT ... ON CONFLICT DO NOTHING is
        safe under concurrent first-time requests — at most one row
        will be created, and the subsequent SELECT always returns it.
        """
        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                user_id,
            )
            row = await conn.fetchrow(f"{_SELECT_USER} WHERE user_id = $1", user_id)
        user = _hydrate_user(row)
        # Row was just inserted (or already existed), so this can never be None.
        assert user is not None
        return user

    async def update_profile(
        self,
        user_id: str,
        updates: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        """
        Update only fields in the allowlist. Returns the updated row.
        Creates the user lazily if they don't exist yet.
        """
        clean = {
            k: v for k, v in coalesce_updates(updates).items()
            if k in _UPDATABLE_USER_FIELDS
        }
        if not clean:
            return await self.get_or_create(user_id)

        # Serialize JSONB fields explicitly.
        for jsonb_col in ("skill_levels", "linked_profiles"):
            if jsonb_col in clean and isinstance(clean[jsonb_col], dict):
                clean[jsonb_col] = json.dumps(clean[jsonb_col])

        cols = list(clean.keys())
        set_clause = ", ".join(f"{c} = ${i+2}" for i, c in enumerate(cols))
        values = [user_id] + [clean[c] for c in cols]

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                    user_id,
                )
                await conn.execute(
                    f"UPDATE users SET {set_clause} WHERE user_id = $1",
                    *values,
                )
                row = await conn.fetchrow(f"{_SELECT_USER} WHERE user_id = $1", user_id)
        return _hydrate_user(row)

    # ---------- saves ----------

    async def save_competition(
        self,
        user_id: str,
        competition_id: str,
        save: bool = True,
    ) -> list[str]:
        """
        Idempotent save/unsave. Returns the user's full saved list afterward.
        The composite PK on (user_id, competition_id) guarantees no duplicates.
        """
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                    user_id,
                )
                if save:
                    await conn.execute(
                        "INSERT INTO saved_competitions (user_id, competition_id) "
                        "VALUES ($1, $2) ON CONFLICT DO NOTHING",
                        user_id, competition_id,
                    )
                else:
                    await conn.execute(
                        "DELETE FROM saved_competitions "
                        "WHERE user_id = $1 AND competition_id = $2",
                        user_id, competition_id,
                    )
                rows = await conn.fetch(
                    "SELECT competition_id FROM saved_competitions "
                    "WHERE user_id = $1 ORDER BY saved_at",
                    user_id,
                )
        return [r["competition_id"] for r in rows]

    async def get_saved_competition_ids(self, user_id: str) -> list[str]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT competition_id FROM saved_competitions "
                "WHERE user_id = $1 ORDER BY saved_at",
                user_id,
            )
        return [r["competition_id"] for r in rows]

    # ---------- entries ----------

    async def record_entry(
        self,
        user_id: str,
        competition_id: str,
        status: str = "registered",
    ) -> None:
        """
        Mark a competition as entered. Idempotent for the same status —
        the UNIQUE (user_id, competition_id, status) constraint prevents
        duplicates.
        """
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                    user_id,
                )
                await conn.execute(
                    "INSERT INTO competition_entries (user_id, competition_id, status) "
                    "VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                    user_id, competition_id, status,
                )

    # ---------- wins ----------

    async def add_win(
        self,
        user_id: str,
        competition_id: str,
        placement: int,
    ) -> list[dict[str, Any]]:
        """
        Record a placement and return the user's win history. Wrapped
        in a transaction so the FK check, insert, and read are consistent.
        """
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                    user_id,
                )
                await conn.execute(
                    "INSERT INTO competition_wins (user_id, competition_id, placement) "
                    "VALUES ($1, $2, $3)",
                    user_id, competition_id, placement,
                )
                rows = await conn.fetch(
                    "SELECT competition_id, placement, recorded_at "
                    "FROM competition_wins WHERE user_id = $1 ORDER BY recorded_at",
                    user_id,
                )
        return records_to_dicts(rows)

    async def get_wins(self, user_id: str) -> list[dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT competition_id, placement, recorded_at "
                "FROM competition_wins WHERE user_id = $1 ORDER BY recorded_at",
                user_id,
            )
        return records_to_dicts(rows)

    # ---------- analytics ----------

    async def get_analytics(self, user_id: str) -> dict[str, Any]:
        """
        Single round-trip aggregate of the user's competition activity.
        Returns both legacy keys and the keys the current frontend reads.
        """
        async with self.pool.acquire() as conn:
            saved_count = await conn.fetchval(
                "SELECT COUNT(*) FROM saved_competitions WHERE user_id = $1",
                user_id,
            ) or 0
            entered_count = await conn.fetchval(
                "SELECT COUNT(DISTINCT competition_id) FROM competition_entries "
                "WHERE user_id = $1",
                user_id,
            ) or 0
            wins_rows = await conn.fetch(
                "SELECT w.competition_id, w.placement, w.recorded_at, "
                "       c.title AS competition_title, c.category AS competition_category, "
                "       c.platform AS competition_platform "
                "FROM competition_wins w "
                "LEFT JOIN competitions c ON c.id = w.competition_id "
                "WHERE w.user_id = $1 ORDER BY w.recorded_at",
                user_id,
            )
            participation_rows = await conn.fetch(
                "SELECT COALESCE(c.category, 'unknown') AS category, "
                "       COUNT(DISTINCT e.competition_id) AS n "
                "FROM competition_entries e "
                "LEFT JOIN competitions c ON c.id = e.competition_id "
                "WHERE e.user_id = $1 GROUP BY 1",
                user_id,
            )
            user_row = await conn.fetchrow(
                "SELECT specializations, preferred_categories, difficulty_preference, "
                "       skill_levels "
                "FROM users WHERE user_id = $1",
                user_id,
            )

        wins = records_to_dicts(wins_rows)
        participation = {r["category"]: int(r["n"]) for r in participation_rows}
        win_rate = (len(wins) / entered_count * 100.0) if entered_count else 0.0

        skill_levels: dict[str, Any] = {}
        specializations: list[str] = []
        preferred_categories: list[str] = []
        difficulty_preference: Optional[str] = None
        if user_row is not None:
            sl = user_row["skill_levels"]
            if isinstance(sl, str):
                try:
                    skill_levels = json.loads(sl)
                except (TypeError, ValueError):
                    skill_levels = {}
            else:
                skill_levels = dict(sl or {})
            specializations = list(user_row["specializations"] or [])
            preferred_categories = list(user_row["preferred_categories"] or [])
            difficulty_preference = user_row["difficulty_preference"]

        return {
            # Legacy / response-schema keys
            "total_competitions_entered": int(entered_count),
            "wins": wins,
            "participation_by_category": participation,
            "skill_progress": skill_levels,
            "recommendations_summary": {
                "preferred_categories": preferred_categories,
                "difficulty_preference": difficulty_preference,
                "specializations": specializations,
            },
            # Keys the current frontend reads
            "competitions_entered": int(entered_count),
            "competitions_won": len(wins),
            "win_rate": round(win_rate, 1),
            "saved_count": int(saved_count),
            "skill_levels": skill_levels,
            "specializations": specializations,
        }
