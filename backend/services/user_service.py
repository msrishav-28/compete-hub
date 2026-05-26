"""
User business logic: profile, saves, entries, wins, analytics.
"""
import logging
from typing import Any, Optional

import asyncpg

from backend.repositories.competition_repository import CompetitionRepository
from backend.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, pool: asyncpg.Pool):
        self.users = UserRepository(pool)
        self.competitions = CompetitionRepository(pool)

    async def get_user_profile(self, user_id: str) -> dict[str, Any]:
        user = await self.users.get_or_create(user_id)
        # Augment with saved IDs so the frontend's existing payload shape
        # is preserved (it reads `saved_competitions` off the profile).
        user["saved_competitions"] = await self.users.get_saved_competition_ids(user_id)
        return {"success": True, "data": user}

    async def update_user_profile(
        self,
        user_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any]:
        user = await self.users.update_profile(user_id, updates)
        if user is not None:
            user["saved_competitions"] = await self.users.get_saved_competition_ids(user_id)
        return {
            "success": True,
            "data": user,
            "message": "Profile updated successfully",
        }

    async def save_competition(
        self,
        user_id: str,
        competition_id: str,
        save: bool,
    ) -> dict[str, Any]:
        # Verify the target competition exists when saving (foreign-key
        # guards us, but a clean 404-ish response is nicer than a 500).
        if save:
            exists = await self.competitions.get_by_id(competition_id)
            if not exists:
                return {
                    "success": False,
                    "error": "Competition not found",
                    "data": {"saved_competitions": await self.users.get_saved_competition_ids(user_id)},
                }
        saved_ids = await self.users.save_competition(user_id, competition_id, save)
        action = "saved" if save else "removed from saved"
        return {
            "success": True,
            "data": {"saved_competitions": saved_ids},
            "message": f"Competition {action} successfully",
        }

    async def enter_competition(
        self,
        user_id: str,
        competition_id: str,
    ) -> dict[str, Any]:
        if not await self.competitions.get_by_id(competition_id):
            return {"success": False, "error": "Competition not found"}
        await self.users.record_entry(user_id, competition_id, status="registered")
        return {"success": True, "message": "Competition entry recorded"}

    async def record_win(
        self,
        user_id: str,
        competition_id: str,
        placement: int,
    ) -> dict[str, Any]:
        if not await self.competitions.get_by_id(competition_id):
            return {"success": False, "error": "Competition not found"}
        wins = await self.users.add_win(user_id, competition_id, placement)
        return {
            "success": True,
            "data": {"wins": wins},
            "message": f"Placement #{placement} recorded successfully",
        }

    async def get_user_analytics(self, user_id: str) -> dict[str, Any]:
        analytics = await self.users.get_analytics(user_id)
        return {"success": True, "data": analytics}

    async def get_saved_competition_ids(self, user_id: str) -> list[str]:
        return await self.users.get_saved_competition_ids(user_id)
