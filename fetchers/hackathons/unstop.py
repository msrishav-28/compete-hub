"""
Unstop fetcher.

Unstop is the dominant student-competition platform in India (target
audience for CompeteHub). They expose a public JSON API at
`/api/public/opportunity/search-result` that powers their own search
UI — no auth required.

Endpoint:
  https://unstop.com/api/public/opportunity/search-result
      ?opportunity={hackathons|competitions}&per_page=20&page=N

We pull both `hackathons` and `competitions` (Unstop separates them).
"""
import logging
import re
from datetime import datetime, timezone
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

_BASE_URL = "https://unstop.com/api/public/opportunity/search-result"
_PER_PAGE = 20
_MAX_PAGES_PER_CATEGORY = 5  # caps at 100 items per category → 200 total
_TIMEOUT = 15
_CATEGORIES = ("hackathons", "competitions")


def _strip_html(html: Optional[str], limit: int = 1000) -> str:
    if not html:
        return ""
    text = BeautifulSoup(html, "html.parser").get_text(" ", strip=True)
    return text[:limit]


def _parse_dt(value: Any) -> Optional[datetime]:
    """Unstop returns ISO strings like '2026-06-12 23:59:00'."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not isinstance(value, str):
        return None
    v = value.strip().replace("Z", "+00:00").replace(" ", "T", 1)
    try:
        dt = datetime.fromisoformat(v)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _extract_first_prize(prizes: List[Dict[str, Any]]) -> tuple[Optional[int], str]:
    """
    Pull the headline prize value + currency. Unstop nests prizes as a
    list of {rank, cash, currency} dicts, with `rank=1` usually the
    grand prize. Falls back to the largest cash value seen.
    """
    if not prizes:
        return None, "INR"
    candidates: List[tuple[int, str]] = []
    for p in prizes:
        if not isinstance(p, dict):
            continue
        cash = p.get("cash") or p.get("amount") or p.get("value")
        if cash is None:
            continue
        try:
            cash_int = int(re.sub(r"[^0-9]", "", str(cash)) or 0)
        except (TypeError, ValueError):
            continue
        if cash_int <= 0:
            continue
        currency = (p.get("currency") or "INR").upper()
        candidates.append((cash_int, currency))
    if not candidates:
        return None, "INR"
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0]


def _categorize(item: Dict[str, Any]) -> CompetitionCategory:
    type_ = (item.get("type") or "").lower()
    subtype = (item.get("subtype") or "").lower()
    if type_ == "hackathons":
        return CompetitionCategory.HACKATHON
    if "coding" in subtype:
        return CompetitionCategory.CODING_CONTEST
    if "pitch" in subtype or "innovation" in subtype or "ideation" in subtype:
        return CompetitionCategory.PITCH_COMPETITION
    if "design" in subtype:
        return CompetitionCategory.DESIGN
    if "case" in subtype or "business" in subtype:
        return CompetitionCategory.PITCH_COMPETITION
    return CompetitionCategory.CORPORATE_CHALLENGE


def _infer_difficulty(prize_inr: Optional[int]) -> DifficultyLevel:
    """
    Heuristic based on prize pool. Unstop prizes are mostly in INR;
    we use them as a rough proxy for stakes.
    """
    if prize_inr is None:
        return DifficultyLevel.INTERMEDIATE
    if prize_inr >= 500_000:
        return DifficultyLevel.EXPERT
    if prize_inr >= 100_000:
        return DifficultyLevel.ADVANCED
    if prize_inr >= 10_000:
        return DifficultyLevel.INTERMEDIATE
    return DifficultyLevel.BEGINNER


def _link_from_seo_url(seo_url: Optional[str], public_url: Optional[str]) -> Optional[str]:
    """Unstop sometimes returns relative paths; normalise to absolute."""
    if seo_url:
        if seo_url.startswith("http"):
            return seo_url
        return f"https://unstop.com/{seo_url.lstrip('/')}"
    if public_url:
        if public_url.startswith("http"):
            return public_url
        return f"https://unstop.com/{public_url.lstrip('/')}"
    return None


class UnstopFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("Unstop")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (CompeteHub/1.0)",
            "Accept": "application/json",
        })

    def fetch(self) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for category in _CATEGORIES:
            for page in range(1, _MAX_PAGES_PER_CATEGORY + 1):
                try:
                    resp = self.session.get(
                        _BASE_URL,
                        params={
                            "opportunity": category,
                            "per_page": _PER_PAGE,
                            "page": page,
                        },
                        timeout=_TIMEOUT,
                    )
                    resp.raise_for_status()
                    payload = resp.json()
                except Exception as e:
                    logger.warning("Unstop %s page %d failed: %s", category, page, e)
                    break

                # Unstop nests results under `data.data` with pagination metadata
                # on the outer `data` object.
                outer = payload.get("data") or {}
                chunk = outer.get("data") or []
                if not chunk:
                    break
                items.extend(chunk)

                total = int(outer.get("total") or 0)
                if outer.get("current_page", page) * _PER_PAGE >= total:
                    break
        logger.info("Unstop: fetched %d raw opportunities", len(items))
        return items

    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        competitions: List[Competition] = []
        now = datetime.now(timezone.utc)

        for raw in data:
            try:
                up_id = raw.get("id")
                title = raw.get("title")
                link = _link_from_seo_url(raw.get("seo_url"), raw.get("public_url"))
                if not up_id or not title or not link:
                    continue

                end = _parse_dt(raw.get("end_date"))
                # Skip already-ended opportunities.
                if end and end < now:
                    continue
                start = _parse_dt(raw.get("start_date"))
                # Many Unstop opportunities have no firm start date — they
                # open the moment the listing goes live. Fall back to the
                # registration-open timestamp, then to "now-ish".
                if not start:
                    reg_start = (raw.get("regnRequirements") or {}).get("start_regn_dt")
                    start = _parse_dt(reg_start) or now

                prize_value, prize_currency = _extract_first_prize(raw.get("prizes") or [])

                reg_req = raw.get("regnRequirements") or {}
                reg_deadline = (
                    _parse_dt(reg_req.get("end_regn_dt"))
                    or _parse_dt(reg_req.get("deadline"))
                )
                team_max = reg_req.get("max_team_size") or reg_req.get("team_max_size")
                team_size = "solo" if team_max == 1 else "team"

                region = (raw.get("region") or "").lower()
                location = "Online" if region == "online" else (raw.get("region") or "India")

                org = (raw.get("organisation") or {}).get("name") or "Unstop"
                category = _categorize(raw)

                skills_required: List[str] = []
                for skill in raw.get("required_skills") or []:
                    if isinstance(skill, dict):
                        name = skill.get("skill_name") or skill.get("skill") or skill.get("name")
                        if name:
                            skills_required.append(name)
                    elif isinstance(skill, str):
                        skills_required.append(skill)

                tags: List[str] = []
                for f in raw.get("filters") or []:
                    if isinstance(f, dict) and f.get("name"):
                        tags.append(f["name"])
                    elif isinstance(f, str):
                        tags.append(f)
                # always tag with the source category for easy filtering
                tags.append("unstop")
                if category == CompetitionCategory.HACKATHON:
                    tags.append("hackathon")

                # Hiring signal: any sufficiently large cash prize, or
                # an explicit "internship"/"job"/"placement" filter.
                hiring_keywords = ("intern", "placement", "hiring", "job", "recruit")
                explicit_hiring = any(
                    kw in (t or "").lower() for t in tags for kw in hiring_keywords
                )
                # Unstop prizes are typically INR. ≥ ₹25k is a useful threshold.
                big_prize = bool(
                    prize_value
                    and prize_currency.upper() == "INR"
                    and prize_value >= 25_000
                )
                recruitment_potential = explicit_hiring or big_prize

                # Time-commitment heuristic from duration.
                if start and end:
                    duration_h = (end - start).total_seconds() / 3600
                    if duration_h <= 24:
                        time_commitment = "low"
                    elif duration_h <= 24 * 7:
                        time_commitment = "medium"
                    else:
                        time_commitment = "high"
                else:
                    duration_h = None
                    time_commitment = "medium"

                comp = Competition()
                comp.id = f"unstop_{up_id}"
                comp.title = title
                comp.description = _strip_html(raw.get("details"))
                comp.category = category
                comp.subcategory = raw.get("subtype") or None
                comp.platform = "Unstop"
                comp.company = org
                comp.start_date = start
                comp.end_date = end
                comp.registration_deadline = reg_deadline
                comp.duration_hours = round(duration_h, 2) if duration_h is not None else None
                comp.time_commitment = time_commitment
                comp.difficulty = _infer_difficulty(prize_value if prize_currency == "INR" else None)
                comp.skills_required = skills_required
                comp.team_size = team_size
                comp.location = location
                comp.link = link
                comp.registration_link = link
                comp.tags = list(dict.fromkeys(t.strip() for t in tags if t and t.strip()))
                comp.recruitment_potential = recruitment_potential
                comp.companies_recruiting = [org] if recruitment_potential and org else []
                comp.portfolio_value = 75 if category == CompetitionCategory.HACKATHON else 60
                comp.source = "Unstop API"

                if prize_value:
                    comp.prize = {
                        "type": "cash",
                        "value": prize_value,
                        "currency": prize_currency,
                    }

                competitions.append(comp)
            except Exception:
                logger.exception("Failed to parse Unstop opportunity id=%s", raw.get("id"))
        return competitions
