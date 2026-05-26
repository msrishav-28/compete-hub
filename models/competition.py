"""
Domain model used by the fetchers.

This is a thin dataclass for fetcher output. The persistence layer
(backend.repositories.competition_repository) consumes `to_dict()`
and writes to the `competitions` table. Fields here mirror the
columns in schema.sql.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional


def _utcnow() -> datetime:
    """Timezone-aware UTC now. Replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


class CompetitionCategory(Enum):
    HACKATHON = "hackathon"
    CODING_CONTEST = "coding_contest"
    CORPORATE_CHALLENGE = "corporate_challenge"
    KAGGLE = "kaggle"
    GSOC = "gsoc"
    BUG_BOUNTY = "bug_bounty"
    CTF = "ctf"
    PITCH_COMPETITION = "pitch_competition"
    ROBOTICS = "robotics"
    DESIGN = "design"
    RESEARCH = "research"
    CLIMATE_TECH = "climate_tech"
    INTERNSHIP = "internship"


class DifficultyLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MIXED = "mixed"


@dataclass
class Competition:
    id: Optional[str] = None              # platform_<source_id>
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[CompetitionCategory] = None
    subcategory: Optional[str] = None
    platform: Optional[str] = None
    company: Optional[str] = None

    # Dates & duration
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    duration_hours: Optional[float] = None
    time_commitment: Optional[str] = None  # 'low' | 'medium' | 'high'

    # Details
    difficulty: Optional[DifficultyLevel] = None
    skills_required: List[str] = field(default_factory=list)
    team_size: Optional[str] = None
    location: Optional[str] = None

    # Prize
    prize: Dict = field(default_factory=lambda: {"type": None, "value": None, "currency": "USD"})

    # Links
    link: Optional[str] = None
    registration_link: Optional[str] = None
    leaderboard_link: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    # Career relevance
    recruitment_potential: bool = False
    companies_recruiting: List[str] = field(default_factory=list)
    portfolio_value: int = 50

    # Provenance
    source: Optional[str] = None
    last_updated: datetime = field(default_factory=_utcnow)
    scraped_at: datetime = field(default_factory=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category.value if self.category else None,
            "subcategory": self.subcategory,
            "platform": self.platform,
            "company": self.company,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "registration_deadline": (
                self.registration_deadline.isoformat() if self.registration_deadline else None
            ),
            "duration_hours": self.duration_hours,
            "time_commitment": self.time_commitment,
            "difficulty": self.difficulty.value if self.difficulty else None,
            "skills_required": list(self.skills_required),
            "team_size": self.team_size,
            "location": self.location,
            "prize": self.prize,
            "link": self.link,
            "registration_link": self.registration_link,
            "leaderboard_link": self.leaderboard_link,
            "tags": list(self.tags),
            "recruitment_potential": bool(self.recruitment_potential),
            "companies_recruiting": list(self.companies_recruiting),
            "portfolio_value": int(self.portfolio_value),
            "source": self.source,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None,
        }
