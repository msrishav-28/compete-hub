"""
Tiny shared helpers for the repository layer.

We deliberately do NOT have a generic BaseRepository class — Postgres is
not document-shaped, and forcing a generic CRUD abstraction over SQL
hides more than it helps. Each repository writes its own SQL.
"""
from typing import Any, Iterable, Mapping

import asyncpg


def record_to_dict(record: asyncpg.Record | None) -> dict[str, Any] | None:
    return dict(record) if record is not None else None


def records_to_dicts(records: Iterable[asyncpg.Record]) -> list[dict[str, Any]]:
    return [dict(r) for r in records]


def coalesce_updates(updates: Mapping[str, Any]) -> dict[str, Any]:
    """Strip None values and empty strings from a partial update payload."""
    return {k: v for k, v in updates.items() if v is not None and v != ""}
