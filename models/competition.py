from enum import Enum
from datetime import datetime
from typing import List, Optional, Dict
from dataclasses import dataclass, field

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
    id: str = None  # Unique identifier (platform_source_id)
    title: str = None
    description: str = None
    category: CompetitionCategory = None
    subcategory: str = None  # e.g., "ML hackathon", "Security CTF"
    platform: str = None  # HackerRank, Codeforces, Hackalist, etc.
    company: Optional[str] = None  # JP Morgan, Google, etc.
    
    # Dates & Duration
    start_date: datetime = None
    end_date: datetime = None
    registration_deadline: Optional[datetime] = None
    duration_hours: Optional[int] = None
    time_commitment: str = None  # "low" (1-3 hrs), "medium" (10-50 hrs), "high" (48+ hrs)
    
    # Details
    difficulty: DifficultyLevel = None
    skills_required: List[str] = field(default_factory=list)  # ["Python", "ML", "Web Dev", "Security"]
    team_size: str = None  # "solo", "team", "mixed"
    location: Optional[str] = None  # "Online", "New York", "Virtual"
    eligibility: str = None  # "University students", "All", "US only"
    
    # Prize & Rewards
    prize: Dict = field(default_factory=lambda: {
        "type": None,  # "cash", "internship", "learning", "experience", "equity"
        "value": None,  # Amount or description
        "currency": "USD"
    })
    
    # Links & Metadata
    link: str = None
    registration_link: Optional[str] = None
    leaderboard_link: Optional[str] = None
    tags: List[str] = field(default_factory=list)  # ["AI", "web", "security", "hiring"]
    recommended_for: List[str] = field(default_factory=list)  # ["ML/DS", "Security", "Web Dev"]
    
    # Career Relevance
    recruitment_potential: bool = False  # Does it lead to jobs?
    companies_recruiting: List[str] = field(default_factory=list)  # Companies that hire winners
    portfolio_value: int = 50  # How valuable for portfolio (1-100)
    
    # Metadata
    source: str = None  # API or Scraper used
    last_updated: datetime = field(default_factory=datetime.now)
    scraped_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        """Convert the Competition object to a dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category.value if self.category else None,
            'subcategory': self.subcategory,
            'platform': self.platform,
            'company': self.company,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
            'duration_hours': self.duration_hours,
            'time_commitment': self.time_commitment,
            'difficulty': self.difficulty.value if self.difficulty else None,
            'skills_required': self.skills_required,
            'team_size': self.team_size,
            'location': self.location,
            'eligibility': self.eligibility,
            'prize': self.prize,
            'link': self.link,
            'registration_link': self.registration_link,
            'leaderboard_link': self.leaderboard_link,
            'tags': self.tags,
            'recommended_for': self.recommended_for,
            'recruitment_potential': self.recruitment_potential,
            'companies_recruiting': self.companies_recruiting,
            'portfolio_value': self.portfolio_value,
            'source': self.source,
            'last_updated': self.last_updated.isoformat(),
            'scraped_at': self.scraped_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Competition':
        """Create a Competition object from a dictionary."""
        comp = cls()
        for key, value in data.items():
            if hasattr(comp, key):
                if key in ['start_date', 'end_date', 'registration_deadline', 'last_updated', 'scraped_at'] and value:
                    setattr(comp, key, datetime.fromisoformat(value) if isinstance(value, str) else value)
                elif key == 'category' and value:
                    setattr(comp, key, CompetitionCategory(value))
                elif key == 'difficulty' and value:
                    setattr(comp, key, DifficultyLevel(value))
                else:
                    setattr(comp, key, value)
        return comp
