"""
Devpost hackathon fetcher.

Replaces the dead Hackalist scraper. Devpost exposes a public JSON
endpoint at /api/hackathons that returns clean structured data for
upcoming/open hackathons.

Endpoint: https://devpost.com/api/hackathons?status[]=upcoming&status[]=open
Pagination: ?page=N  (default 9 items per page)
"""
import calendar
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup

from fetchers.base_fetcher import BaseFetcher
from models.competition import (
    Competition,
    CompetitionCategory,
    DifficultyLevel,
)

logger = logging.getLogger(__name__)

_BASE_URL = "https://devpost.com/api/hackathons"
_MAX_PAGES = 6   # 6 * 9 = 54 hackathons. Plenty for our scale; raise if needed.
_TIMEOUT = 15

_MONTH_MAP = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
_MONTH_MAP.update({m.lower(): i for i, m in enumerate(calendar.month_name) if m})

# "May 05 - Jun 11, 2026"   -> two months
# "May 05 - 31, 2026"        -> same month
_DATE_RANGE_RE = re.compile(
    r"(?P<m1>[A-Za-z]+)\s+(?P<d1>\d{1,2})\s*-\s*"
    r"(?:(?P<m2>[A-Za-z]+)\s+)?(?P<d2>\d{1,2}),\s*(?P<year>\d{4})"
)


def _parse_date_range(text: str) -> tuple[Optional[datetime], Optional[datetime]]:
    """Parse Devpost's `submission_period_dates` field. Returns UTC datetimes."""
    if not text:
        return None, None
    m = _DATE_RANGE_RE.search(text)
    if not m:
        return None, None
    try:
        year = int(m.group("year"))
        m1 = _MONTH_MAP.get(m.group("m1").lower())
        m2 = _MONTH_MAP.get((m.group("m2") or m.group("m1")).lower())
        if not m1 or not m2:
            return None, None
        start = datetime(year, m1, int(m.group("d1")), tzinfo=timezone.utc)
        end = datetime(year, m2, int(m.group("d2")), 23, 59, 59, tzinfo=timezone.utc)
        # End-of-day on the end date; if range crosses year (unusual), bump year.
        if end < start:
            end = end.replace(year=year + 1)
        return start, end
    except (ValueError, TypeError):
        return None, None


def _extract_prize_amount(html_blob: Optional[str]) -> Optional[int]:
    """Pull the digits out of `prize_amount` which arrives as embedded HTML."""
    if not html_blob:
        return None
    text = BeautifulSoup(html_blob, "html.parser").get_text(" ", strip=True)
    digits = re.sub(r"[^0-9]", "", text.split(".")[0])  # strip cents if any
    return int(digits) if digits else None


_THEME_TO_TAGS: Dict[str, List[str]] = {
    # rough mapping of Devpost themes to our skill tags
    "machine learning/ai": ["AI", "Machine Learning"],
    "databases": ["Databases"],
    "open ended": [],
    "web": ["Web Development"],
    "mobile": ["Mobile Development"],
    "blockchain": ["Blockchain"],
    "fintech": ["Fintech"],
    "social good": ["Social Impact"],
    "education": ["EdTech"],
    "health": ["Healthcare"],
    "ar/vr": ["AR", "VR"],
    "iot": ["IoT"],
    "gaming": ["Game Development"],
    "design": ["Design"],
}


def _themes_to_tags(themes: List[Dict[str, Any]]) -> List[str]:
    tags: List[str] = ["hackathon"]
    for t in themes or []:
        name = (t.get("name") or "").strip()
        if not name:
            continue
        mapped = _THEME_TO_TAGS.get(name.lower())
        if mapped is not None:
            tags.extend(mapped)
        else:
            tags.append(name)
    # dedupe, preserve order
    seen: set[str] = set()
    out: List[str] = []
    for t in tags:
        if t.lower() not in seen:
            seen.add(t.lower())
            out.append(t)
    return out


def _infer_difficulty(prize_value: Optional[int]) -> DifficultyLevel:
    if prize_value is None:
        return DifficultyLevel.INTERMEDIATE
    if prize_value >= 50_000:
        return DifficultyLevel.EXPERT
    if prize_value >= 10_000:
        return DifficultyLevel.ADVANCED
    if prize_value >= 1_000:
        return DifficultyLevel.INTERMEDIATE
    return DifficultyLevel.BEGINNER


class DevpostFetcher(BaseFetcher):
    """Fetches upcoming/open hackathons from Devpost."""

    def __init__(self):
        super().__init__("Devpost")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
            "Accept": "application/json",
        })

    def fetch(self) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for page in range(1, _MAX_PAGES + 1):
            try:
                resp = self.session.get(
                    _BASE_URL,
                    params=[
                        ("status[]", "upcoming"),
                        ("status[]", "open"),
                        ("page", str(page)),
                    ],
                    timeout=_TIMEOUT,
                )
                resp.raise_for_status()
                payload = resp.json()
            except Exception as e:
                logger.warning("Devpost page %d failed: %s", page, e)
                break

            chunk = payload.get("hackathons") or []
            if not chunk:
                break
            items.extend(chunk)

            meta = payload.get("meta") or {}
            total = int(meta.get("total_count") or 0)
            if len(items) >= total:
                break
        logger.info("Devpost: fetched %d hackathons across %d pages", len(items), page)
        return items

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        competitions: List[Competition] = []
        for raw in data:
            try:
                dp_id = raw.get("id")
                title = raw.get("title")
                url = raw.get("url")
                if not dp_id or not title or not url:
                    continue

                start, end = _parse_date_range(raw.get("submission_period_dates") or "")
                prize_value = _extract_prize_amount(raw.get("prize_amount"))

                comp = Competition()
                comp.id = f"devpost_{dp_id}"
                comp.title = title
                comp.description = ", ".join(
                    t.get("name", "") for t in (raw.get("themes") or [])
                ) or f"Hackathon hosted on Devpost"
                comp.category = CompetitionCategory.HACKATHON
                comp.platform = "Devpost"
                comp.company = raw.get("organization_name") or None
                comp.start_date = start
                comp.end_date = end
                if start and end:
                    comp.duration_hours = (end - start).total_seconds() / 3600

                comp.difficulty = _infer_difficulty(prize_value)
                comp.skills_required = ["Software Development", "Teamwork", "Rapid Prototyping"]
                comp.team_size = "team"
                # Hackathons are typically multi-day, intense events.
                comp.time_commitment = "high"
                location = (raw.get("displayed_location") or {}).get("location") or ""
                comp.location = location or "Online"
                comp.link = url
                comp.registration_link = url
                comp.tags = _themes_to_tags(raw.get("themes") or [])
                comp.portfolio_value = 75
                # Featured / heavy-prize hackathons get hire signal.
                comp.recruitment_potential = bool(
                    raw.get("featured") or (prize_value or 0) >= 10_000
                )
                comp.source = "Devpost API"

                if prize_value:
                    comp.prize = {
                        "type": "cash",
                        "value": prize_value,
                        "currency": "USD",
                    }

                competitions.append(comp)
            except Exception:
                logger.exception("Failed to parse Devpost hackathon id=%s", raw.get("id"))
        return competitions

    def validate_competition(self, competition: Competition) -> bool:
        if not competition.title or not competition.link or not competition.id:
            return False
        # Drop already-ended hackathons.
        if competition.end_date and competition.end_date < datetime.now(timezone.utc):
            return False
        return True
