"""
Recommendation scoring. Pure Python on top of repository data.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import asyncpg

from backend.repositories.competition_repository import CompetitionRepository
from backend.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class RecommendationService:
    WEIGHT_CATEGORY = 30
    WEIGHT_DIFFICULTY = 25
    WEIGHT_SKILLS = 25
    WEIGHT_TIME = 10
    WEIGHT_RECRUITMENT = 10

    def __init__(self, pool: asyncpg.Pool):
        self.users = UserRepository(pool)
        self.competitions = CompetitionRepository(pool)

    async def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
    ) -> dict[str, Any]:
        user = await self.users.get_by_user_id(user_id)
        if user is None:
            return await self._default_recommendations(limit)

        saved_ids = set(await self.users.get_saved_competition_ids(user_id))

        # Cap candidate pool — 500 is way more than enough for this scale.
        all_competitions = await self.competitions.get_all(limit=500)
        if not all_competitions:
            return {"success": True, "data": [], "message": "No competitions available"}

        scored: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc)
        for comp in all_competitions:
            if comp.get("id") in saved_ids:
                continue
            score, reasons = self._score(comp, user, now)
            if score > 0:
                scored.append({
                    "competition": comp,
                    "score": score,
                    "match_score": score,  # alias the existing frontend reads
                    "reasons": reasons,
                })
        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[:limit]

        return {
            "success": True,
            "data": top,
            "count": len(top),
            "user_preferences": {
                "categories": user.get("preferred_categories", []),
                "difficulty": user.get("difficulty_preference"),
                "skills": list((user.get("skill_levels") or {}).keys()),
            },
        }

    def _score(
        self,
        competition: dict[str, Any],
        user: dict[str, Any],
        now: datetime,
    ) -> tuple[float, list[str]]:
        reasons: list[str] = []
        score = 0.0

        # Skip past competitions (start_date is TIMESTAMPTZ from the DB).
        start = competition.get("start_date")
        if isinstance(start, datetime):
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if start < now:
                return 0, []

        # Category
        user_categories = user.get("preferred_categories") or []
        comp_category = competition.get("category", "")
        if comp_category and comp_category in user_categories:
            score += self.WEIGHT_CATEGORY
            reasons.append(f"Matches your interest in {comp_category}")
        elif user_categories:
            score += self.WEIGHT_CATEGORY * 0.3
        else:
            score += self.WEIGHT_CATEGORY * 0.5

        # Difficulty
        difficulty_order = ["beginner", "intermediate", "advanced", "expert"]
        user_difficulty = user.get("difficulty_preference") or "intermediate"
        comp_difficulty = competition.get("difficulty") or "intermediate"
        try:
            gap = abs(difficulty_order.index(user_difficulty) - difficulty_order.index(comp_difficulty))
            if gap == 0:
                score += self.WEIGHT_DIFFICULTY
                reasons.append(f"Perfect difficulty match ({comp_difficulty})")
            elif gap == 1:
                score += self.WEIGHT_DIFFICULTY * 0.7
                reasons.append(f"Close to your level ({comp_difficulty})")
            else:
                score += self.WEIGHT_DIFFICULTY * 0.3
        except ValueError:
            score += self.WEIGHT_DIFFICULTY * 0.5

        # Skills overlap
        user_skills = set((user.get("skill_levels") or {}).keys())
        comp_skills = set(competition.get("skills_required") or [])
        if user_skills and comp_skills:
            overlap = user_skills & comp_skills
            if overlap:
                ratio = len(overlap) / len(comp_skills)
                score += self.WEIGHT_SKILLS * ratio
                reasons.append(f"Matches your skills: {', '.join(list(overlap)[:3])}")
            else:
                score += self.WEIGHT_SKILLS * 0.2
        else:
            score += self.WEIGHT_SKILLS * 0.5

        # Time commitment fit
        commitment_hours = {"low": 5, "medium": 15, "high": 30}
        estimated = commitment_hours.get(competition.get("time_commitment") or "medium", 15)
        user_time = user.get("time_available_weekly") or 10
        if user_time >= estimated:
            score += self.WEIGHT_TIME
            reasons.append("Fits your schedule")
        elif user_time >= estimated * 0.7:
            score += self.WEIGHT_TIME * 0.6

        # Recruitment / hiring goal
        if competition.get("recruitment_potential"):
            goals = user.get("goals") or []
            kw = ("job", "career", "internship", "hiring", "recruitment")
            if any(k in g.lower() for g in goals for k in kw):
                score += self.WEIGHT_RECRUITMENT
                reasons.append("Has recruitment opportunities")
            else:
                score += self.WEIGHT_RECRUITMENT * 0.5

        max_possible = (
            self.WEIGHT_CATEGORY + self.WEIGHT_DIFFICULTY + self.WEIGHT_SKILLS
            + self.WEIGHT_TIME + self.WEIGHT_RECRUITMENT
        )
        normalized = (score / max_possible) * 100
        return round(normalized, 2), reasons

    async def _default_recommendations(self, limit: int) -> dict[str, Any]:
        upcoming = await self.competitions.get_upcoming(days=30, limit=limit)
        data = [
            {
                "competition": c,
                "score": 50.0,
                "match_score": 50.0,
                "reasons": ["Popular upcoming competition"],
            }
            for c in upcoming
        ]
        return {
            "success": True,
            "data": data,
            "count": len(data),
            "message": "Default recommendations - complete your profile for personalized suggestions",
        }
