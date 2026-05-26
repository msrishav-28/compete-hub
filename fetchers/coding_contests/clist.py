"""
clist.by fetcher — aggregator for 80+ competitive programming sites.

Single source covers CodeChef, AtCoder, TopCoder, LeetCode, HackerEarth
hackathons, Google Kick Start, ICPC events, etc. Skipped silently when
no credentials are configured (mirror the Kaggle pattern).

API:    https://clist.by/api/v4/contest/?upcoming=true
Auth:   ?username=...&api_key=... query params
Limit:  10 req/min; we make 1 request per refresh.

Get a key (free):  https://clist.by/api/v4/doc/ → sign in → API key.
"""
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

from fetchers.base_fetcher import BaseFetcher
from models.competition import (
    Competition,
    CompetitionCategory,
    DifficultyLevel,
)

logger = logging.getLogger(__name__)

_BASE_URL = "https://clist.by/api/v4/contest/"
_LIMIT = 200
_TIMEOUT = 15

# Resource → display platform. Anything not listed gets a Title-cased
# fallback derived from the resource host.
_RESOURCE_PLATFORMS: Dict[str, str] = {
    "codechef.com": "CodeChef",
    "atcoder.jp": "AtCoder",
    "leetcode.com": "LeetCode",
    "topcoder.com": "TopCoder",
    "hackerearth.com": "HackerEarth",
    "codingcompetitions.withgoogle.com": "Google Coding Competitions",
    "icpc.global": "ICPC",
    "projecteuler.net": "Project Euler",
    "codewars.com": "Codewars",
    "codingame.com": "CodinGame",
}

# Resource → difficulty heuristic
_RESOURCE_DIFFICULTY: Dict[str, DifficultyLevel] = {
    "codeforces.com": DifficultyLevel.ADVANCED,
    "codechef.com": DifficultyLevel.INTERMEDIATE,
    "atcoder.jp": DifficultyLevel.INTERMEDIATE,
    "leetcode.com": DifficultyLevel.INTERMEDIATE,
    "topcoder.com": DifficultyLevel.ADVANCED,
    "icpc.global": DifficultyLevel.EXPERT,
    "codingcompetitions.withgoogle.com": DifficultyLevel.ADVANCED,
}

# We have a dedicated CodeforcesFetcher; don't double-emit.
_EXCLUDED_RESOURCES = {"codeforces.com"}


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not isinstance(value, str):
        return None
    v = value.replace("Z", "+00:00")
    # clist returns "2026-05-30T12:00:00" (naive UTC) or with offset.
    try:
        dt = datetime.fromisoformat(v)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _resource_to_platform(resource: str) -> str:
    if not resource:
        return "Online Judge"
    host = resource.lower().strip()
    if host in _RESOURCE_PLATFORMS:
        return _RESOURCE_PLATFORMS[host]
    # Strip TLD and capitalise.
    head = host.split(".")[0]
    return head.replace("_", " ").replace("-", " ").title()


class ClistFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("clist.by")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
            "Accept": "application/json",
        })

    def _credentials(self) -> Optional[tuple[str, str]]:
        username = os.getenv("CLIST_USERNAME")
        api_key = os.getenv("CLIST_API_KEY")
        if username and api_key:
            return username, api_key
        return None

    def fetch(self) -> List[Dict[str, Any]]:
        creds = self._credentials()
        if not creds:
            logger.info(
                "clist.by: CLIST_USERNAME/CLIST_API_KEY not configured; skipping. "
                "Get a free key at https://clist.by/api/v4/doc/"
            )
            return []
        username, api_key = creds
        try:
            resp = self.session.get(
                _BASE_URL,
                params={
                    "upcoming": "true",
                    "order_by": "start",
                    "limit": _LIMIT,
                    "username": username,
                    "api_key": api_key,
                    "format": "json",
                },
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            payload = resp.json()
            return payload.get("objects") or []
        except requests.HTTPError as e:
            logger.error("clist.by HTTP error: %s", e)
            return []
        except Exception as e:
            logger.error("clist.by fetch failed: %s", e)
            return []

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        competitions: List[Competition] = []
        now = datetime.now(timezone.utc)

        for raw in data:
            try:
                resource = (raw.get("resource") or "").lower()
                if not resource or resource in _EXCLUDED_RESOURCES:
                    continue

                start = _parse_dt(raw.get("start"))
                end = _parse_dt(raw.get("end"))
                if not start or start < now:
                    continue

                cid = raw.get("id")
                title = raw.get("event") or "Contest"
                href = raw.get("href")
                if not cid or not href:
                    continue

                duration_seconds = raw.get("duration")
                duration_hours: Optional[float] = None
                if duration_seconds:
                    try:
                        duration_hours = round(float(duration_seconds) / 3600, 2)
                    except (TypeError, ValueError):
                        duration_hours = None

                comp = Competition()
                comp.id = f"clist_{cid}"
                comp.title = title
                comp.description = f"Contest on {_resource_to_platform(resource)} (via clist.by)"
                comp.category = CompetitionCategory.CODING_CONTEST
                comp.platform = _resource_to_platform(resource)
                comp.start_date = start
                comp.end_date = end
                comp.duration_hours = duration_hours
                comp.difficulty = _RESOURCE_DIFFICULTY.get(resource, DifficultyLevel.INTERMEDIATE)
                comp.team_size = "solo"
                if duration_hours is not None:
                    if duration_hours <= 5:
                        comp.time_commitment = "low"
                    elif duration_hours <= 24:
                        comp.time_commitment = "medium"
                    else:
                        comp.time_commitment = "high"
                else:
                    comp.time_commitment = "medium"
                comp.skills_required = ["Algorithms", "Data Structures", "Problem Solving"]
                comp.link = href
                comp.registration_link = href
                comp.tags = ["competitive programming", comp.platform]
                comp.portfolio_value = 45
                comp.recruitment_potential = resource in (
                    "topcoder.com",
                    "codingcompetitions.withgoogle.com",
                    "icpc.global",
                )
                comp.source = "clist.by API"
                competitions.append(comp)
            except Exception:
                logger.exception("Failed to parse clist.by contest id=%s", raw.get("id"))
        return competitions
