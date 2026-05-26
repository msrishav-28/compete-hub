"""
Competition business logic. Thin layer over the repository — just
shapes responses and computes pagination metadata.
"""
from typing import Any, Optional

import asyncpg

from backend.repositories.competition_repository import CompetitionRepository


class CompetitionService:
    def __init__(self, pool: asyncpg.Pool):
        self.repo = CompetitionRepository(pool)

    async def get_competitions(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        time_commitment: Optional[str] = None,
        platform: Optional[str] = None,
        recruitment_only: bool = False,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        competitions, total = await self.repo.get_filtered(
            category=category,
            difficulty=difficulty,
            time_commitment=time_commitment,
            platform=platform,
            recruitment_only=recruitment_only,
            search=search,
            limit=limit,
            offset=offset,
        )
        total_pages = (total + limit - 1) // limit if limit > 0 else 1
        page = offset // limit + 1 if limit > 0 else 1
        return {
            "success": True,
            "data": competitions,
            "total": total,
            "limit": limit,
            "offset": offset,
            "page": page,
            "total_pages": total_pages,
        }

    async def get_competition_by_id(self, competition_id: str) -> Optional[dict[str, Any]]:
        return await self.repo.get_by_id(competition_id)

    async def get_upcoming_week(self) -> dict[str, Any]:
        upcoming = await self.repo.get_upcoming(days=7)
        return {"success": True, "data": upcoming, "count": len(upcoming)}

    async def get_stats_overview(self) -> dict[str, Any]:
        return {"success": True, "data": await self.repo.get_stats()}

    async def count(self) -> int:
        return await self.repo.count_all()

    async def sync_competitions(self, competitions: list[Any]) -> int:
        return await self.repo.upsert_many(competitions)
