"""
Codeforces fetcher — public API at https://codeforces.com/api/contest.list.

All datetimes are timezone-aware UTC. The Codeforces API returns Unix
epoch seconds, which we wrap as `datetime.fromtimestamp(..., tz=UTC)`.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

import requests

from fetchers.base_fetcher import BaseFetcher
from models.competition import (
    Competition,
    CompetitionCategory,
    DifficultyLevel,
)

logger = logging.getLogger(__name__)


class CodeforcesFetcher(BaseFetcher):
    """Fetches upcoming coding contests from the Codeforces API."""

    def __init__(self):
        super().__init__("Codeforces")
        self.base_url = "https://codeforces.com/api"
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
            "Accept": "application/json",
        })

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            resp = self.session.get(f"{self.base_url}/contest.list", timeout=15)
            resp.raise_for_status()
            payload = resp.json()
            if payload.get("status") != "OK":
                logger.warning("Codeforces returned non-OK status: %s", payload.get("comment"))
                return []
            return payload.get("result", []) or []
        except Exception as e:
            logger.error("Codeforces fetch failed: %s", e)
            return []

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        competitions: List[Competition] = []
        now = datetime.now(timezone.utc)

        for contest in data:
            try:
                # Keep only Codeforces Round contests that haven't started yet.
                # `phase=BEFORE` means scheduled but not yet running.
                if contest.get("type") != "CF" or contest.get("phase") != "BEFORE":
                    continue

                start_seconds = contest.get("startTimeSeconds")
                if not start_seconds:
                    continue

                start = datetime.fromtimestamp(start_seconds, tz=timezone.utc)
                # Defensive — Codeforces should never serve past contests in BEFORE phase.
                if start < now:
                    continue

                duration_seconds = int(contest.get("durationSeconds") or 7200)
                end = datetime.fromtimestamp(start_seconds + duration_seconds, tz=timezone.utc)

                comp = Competition()
                comp.id = f"codeforces_{contest.get('id')}"
                comp.title = contest.get("name", "Codeforces Contest")
                comp.description = f"Codeforces {contest.get('type', 'CF')} Contest"
                comp.category = CompetitionCategory.CODING_CONTEST
                comp.platform = "Codeforces"

                title = comp.title or ""
                if "Div. 1" in title:
                    comp.difficulty = DifficultyLevel.ADVANCED
                elif "Div. 2" in title:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                elif "Div. 3" in title or "Div. 4" in title:
                    comp.difficulty = DifficultyLevel.BEGINNER
                else:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE

                comp.start_date = start
                comp.end_date = end
                comp.duration_hours = round(duration_seconds / 3600, 2)
                comp.time_commitment = "medium" if comp.duration_hours <= 5 else "high"
                comp.link = f"https://codeforces.com/contests/{contest.get('id')}"
                comp.registration_link = comp.link
                comp.team_size = "solo"
                comp.skills_required = ["Algorithms", "Data Structures", "Problem Solving"]
                comp.tags = ["competitive programming", "algorithms"]
                comp.portfolio_value = 50
                comp.recruitment_potential = True
                comp.companies_recruiting = ["Top Tech Companies"]
                comp.source = "Codeforces API"

                competitions.append(comp)
            except Exception:
                logger.exception("Failed to parse Codeforces contest id=%s", contest.get("id"))
        return competitions
