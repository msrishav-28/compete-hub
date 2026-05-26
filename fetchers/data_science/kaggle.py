"""
Kaggle competitions fetcher.

Kaggle's public unauthenticated endpoint now returns 401. Their
official API requires a username/key pair (free, get one at
https://www.kaggle.com/settings/account → "Create New Token").

If `KAGGLE_USERNAME` and `KAGGLE_KEY` are set, we authenticate and
fetch normally. Otherwise we cleanly emit zero competitions — the
fetcher service logs this as "empty" status rather than an error.
"""
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests

from fetchers.base_fetcher import BaseFetcher
from models.competition import (
    Competition,
    CompetitionCategory,
    DifficultyLevel,
)

logger = logging.getLogger(__name__)


class KaggleFetcher(BaseFetcher):
    """Fetches data-science competitions from Kaggle's official API."""

    def __init__(self):
        super().__init__("Kaggle")
        self.base_url = "https://www.kaggle.com/api/v1/competitions"
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
        })

    def _credentials(self) -> Optional[tuple[str, str]]:
        username = os.getenv("KAGGLE_USERNAME")
        key = os.getenv("KAGGLE_KEY")
        if username and key:
            return username, key
        return None

    def fetch(self) -> List[Dict[str, Any]]:
        creds = self._credentials()
        if not creds:
            logger.info(
                "Kaggle: KAGGLE_USERNAME/KAGGLE_KEY not configured; skipping. "
                "Set them in env to enable this source."
            )
            return []

        try:
            resp = self.session.get(
                f"{self.base_url}/list",
                params={"sortBy": "latestDeadline"},
                auth=creds,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.json() or []
        except requests.HTTPError as e:
            logger.error("Kaggle API error: %s", e)
            return []
        except Exception as e:
            logger.error("Kaggle fetch failed: %s", e)
            return []

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        competitions: List[Competition] = []
        now = datetime.now(timezone.utc)

        for raw in data:
            try:
                if raw.get("status") not in ("active", "ongoing", "open"):
                    # Kaggle uses several status strings; "completed" we skip.
                    if (raw.get("status") or "").lower() == "completed":
                        continue

                deadline = self._parse_dt(raw.get("deadline"))
                enabled = self._parse_dt(raw.get("enabledDate"))
                if not deadline or not enabled:
                    continue
                if deadline < now:
                    continue

                comp = Competition()
                comp.id = f"kaggle_{raw.get('id') or raw.get('url') or raw.get('ref')}"
                comp.title = raw.get("title", "Kaggle Competition")
                comp.description = (raw.get("description") or "")[:1000]
                comp.category = CompetitionCategory.KAGGLE
                comp.platform = "Kaggle"
                comp.company = raw.get("organizationName") or "Kaggle"

                reward = raw.get("reward") or 0
                try:
                    reward = int(reward)
                except (TypeError, ValueError):
                    reward = 0

                if reward >= 50_000:
                    comp.difficulty = DifficultyLevel.EXPERT
                elif reward >= 10_000:
                    comp.difficulty = DifficultyLevel.ADVANCED
                elif reward >= 1_000:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                else:
                    comp.difficulty = DifficultyLevel.BEGINNER

                comp.start_date = enabled
                comp.end_date = deadline
                comp.duration_hours = round((deadline - enabled).total_seconds() / 3600, 2)
                # Registration usually closes shortly before deadline.
                comp.registration_deadline = max(enabled, deadline - timedelta(days=7))

                url = raw.get("url") or ""
                comp.link = f"https://kaggle.com/c/{url}" if url else "https://kaggle.com/competitions"
                comp.team_size = "team" if (raw.get("teamCount") or 1) > 1 else "solo"
                comp.time_commitment = "high"
                comp.skills_required = ["Data Science", "Machine Learning", "Python"]

                tags = ["data science", "machine learning", "kaggle"]
                title_lower = comp.title.lower()
                for kw, extra in (
                    (("nlp", "natural language"), ["nlp"]),
                    (("vision", "image", "cv "), ["computer vision"]),
                    (("tabular", "structured"), ["tabular"]),
                    (("forecast", "time series"), ["time series"]),
                ):
                    if any(k in title_lower for k in kw):
                        tags.extend(extra)
                comp.tags = list(dict.fromkeys(tags))

                comp.portfolio_value = 80
                comp.recruitment_potential = reward >= 5_000
                comp.companies_recruiting = [comp.company] if comp.company else []
                comp.source = "Kaggle API"
                if reward > 0:
                    comp.prize = {"type": "cash", "value": reward, "currency": "USD"}

                competitions.append(comp)
            except Exception:
                logger.exception("Failed to parse Kaggle competition id=%s", raw.get("id"))
        return competitions

    @staticmethod
    def _parse_dt(value: Any) -> Optional[datetime]:
        if not value:
            return None
        # Kaggle uses "2024-12-31T23:59:59.000Z" or similar.
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if not isinstance(value, str):
            return None
        v = value.replace("Z", "+00:00")
        for fmt in (None,):  # Try fromisoformat first
            try:
                dt = datetime.fromisoformat(v)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ"):
            try:
                dt = datetime.strptime(value.replace("Z", "+0000"), fmt)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        return None
