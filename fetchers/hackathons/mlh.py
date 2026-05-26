"""
MLH (Major League Hacking) season-schedule fetcher.

MLH doesn't expose a public JSON API for events, but their season
schedule page at https://mlh.io/seasons/{year}/events is plain HTML
with parseable `.rounded-card` blocks (~30 events per season).

Season convention: season N runs from July of year N-1 to June of year N.
We fetch the current season AND the next season, since student
hackathons are scheduled months in advance.

Each card embeds:
  - Title in <h4>
  - Date range and location in two <span class="text-sm truncate">
  - Stable UUID in the event-thumbnail image URL
  - External event URL on the parent <a>
"""
import calendar
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup
from bs4 import Tag

from fetchers.base_fetcher import BaseFetcher
from models.competition import (
    Competition,
    CompetitionCategory,
    DifficultyLevel,
)

logger = logging.getLogger(__name__)

_TIMEOUT = 15
_MIN_CARDS_BEFORE_TRUSTING = 3   # if fewer than this parse, treat as selector drift
_UUID_RE = re.compile(
    r"/events/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/",
    re.IGNORECASE,
)

_MONTH_MAP = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
_MONTH_MAP.update({m.lower(): i for i, m in enumerate(calendar.month_name) if m})


def _current_season_year(now: Optional[datetime] = None) -> int:
    """
    MLH season X runs Jul of (X-1) to Jun of X.
    So in May 2026 we're in season 2026; in Aug 2026 we're in season 2027.
    """
    now = now or datetime.now(timezone.utc)
    return now.year + 1 if now.month >= 7 else now.year


def _month_to_year(month: int, season_year: int) -> int:
    """Within a season, months 7..12 belong to (season_year - 1)."""
    return season_year - 1 if month >= 7 else season_year


def _parse_date_range(text: str, season_year: int) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Parse MLH's date format:
      "MAY 30 - 31"           same month
      "MAY 30 - JUN 2"        cross-month
      "DEC 30 - JAN 3"        cross-year (Dec -> next-year Jan)
    """
    if not text:
        return None, None

    parts = re.split(r"\s*-\s*", text.strip(), maxsplit=1)
    if len(parts) != 2:
        return None, None

    left = parts[0].strip().split()
    right = parts[1].strip().split()

    if len(left) != 2:
        return None, None

    try:
        m1 = _MONTH_MAP.get(left[0].lower())
        d1 = int(left[1])
    except (ValueError, IndexError):
        return None, None
    if not m1:
        return None, None

    if len(right) == 1:
        m2, d2_str = left[0], right[0]
    elif len(right) == 2:
        m2, d2_str = right[0], right[1]
    else:
        return None, None

    m2_num = _MONTH_MAP.get(m2.lower())
    if not m2_num:
        return None, None
    try:
        d2 = int(d2_str)
    except ValueError:
        return None, None

    try:
        y1 = _month_to_year(m1, season_year)
        y2 = _month_to_year(m2_num, season_year)
        # Cross-year roll-over within the season (Dec → Jan)
        if m2_num < m1:
            y2 = y1 + 1
        start = datetime(y1, m1, d1, tzinfo=timezone.utc)
        end = datetime(y2, m2_num, d2, 23, 59, 59, tzinfo=timezone.utc)
        return start, end
    except ValueError:
        return None, None


def _extract_uuid(card: Tag) -> Optional[str]:
    for img in card.select("img"):
        src = img.get("src") or ""
        m = _UUID_RE.search(src)
        if m:
            return m.group(1)
    return None


def _location_text(spans: List[str]) -> str:
    # First span is the date; subsequent text-sm-truncate span(s) are location.
    return spans[1] if len(spans) > 1 else "Online"


class MLHFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("MLH")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
        })

    def fetch(self) -> List[Dict[str, Any]]:
        """
        Returns a list of {"season_year": int, "html": str} dicts so parse()
        knows which season each card came from (needed for year disambiguation).
        """
        current = _current_season_year()
        seasons = [current, current + 1]
        out: List[Dict[str, Any]] = []
        for year in seasons:
            try:
                resp = self.session.get(
                    f"https://mlh.io/seasons/{year}/events",
                    timeout=_TIMEOUT,
                )
                resp.raise_for_status()
                out.append({"season_year": year, "html": resp.text})
            except Exception as e:
                logger.warning("MLH season %d fetch failed: %s", year, e)
        return out

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        now = datetime.now(timezone.utc)
        competitions: List[Competition] = []
        seen_uuids: set[str] = set()

        for entry in data:
            html = entry.get("html") or ""
            season_year = int(entry.get("season_year") or _current_season_year())
            soup = BeautifulSoup(html, "html.parser")
            cards = soup.select(".rounded-card")
            if not cards:
                logger.warning("MLH season %d: no .rounded-card elements found", season_year)
                continue

            parsed_this_season = 0
            for card in cards:
                try:
                    h4 = card.select_one("h4")
                    if not h4:
                        continue
                    title = h4.get_text(strip=True)
                    if not title:
                        continue

                    parent_a = card.find_parent("a")
                    link = parent_a.get("href") if parent_a else None
                    if not link:
                        continue

                    spans = [s.get_text(strip=True) for s in card.select("span.text-sm.truncate")]
                    if not spans:
                        continue

                    start, end = _parse_date_range(spans[0], season_year)
                    if not start or not end:
                        continue
                    if end < now:
                        continue

                    uuid = _extract_uuid(card)
                    if uuid:
                        if uuid in seen_uuids:
                            continue
                        seen_uuids.add(uuid)
                        cid = f"mlh_{uuid}"
                    else:
                        # Fall back to a slug-from-title key — less stable
                        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
                        cid = f"mlh_{slug}_{season_year}"
                        if cid in seen_uuids:
                            continue
                        seen_uuids.add(cid)

                    duration_h = (end - start).total_seconds() / 3600

                    comp = Competition()
                    comp.id = cid
                    comp.title = title
                    comp.description = f"MLH Member Event in {_location_text(spans)}"
                    comp.category = CompetitionCategory.HACKATHON
                    comp.platform = "MLH"
                    comp.start_date = start
                    comp.end_date = end
                    comp.duration_hours = round(duration_h, 2)
                    comp.time_commitment = "high"
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                    comp.team_size = "team"
                    comp.location = _location_text(spans)
                    comp.link = link
                    comp.registration_link = link
                    comp.skills_required = ["Software Development", "Teamwork", "Rapid Prototyping"]
                    comp.tags = ["hackathon", "mlh", "student"]
                    comp.portfolio_value = 70
                    comp.recruitment_potential = False
                    comp.source = "MLH HTML"
                    competitions.append(comp)
                    parsed_this_season += 1
                except Exception:
                    logger.exception("Failed to parse MLH card")

            logger.info("MLH season %d: parsed %d / %d cards",
                        season_year, parsed_this_season, len(cards))

        # Selector-drift guard.
        if data and len(competitions) < _MIN_CARDS_BEFORE_TRUSTING:
            logger.warning(
                "MLH: only %d competitions parsed across %d seasons — selector drift likely; emitting empty result.",
                len(competitions), len(data),
            )
            return []
        return competitions
