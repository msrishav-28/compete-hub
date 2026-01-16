from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, field

@dataclass
class UserProfile:
    """Class representing a user's profile and preferences."""
    
    user_id: str
    name: str = ""
    email: str = ""
    college: str = ""
    year: Optional[int] = None  # 1, 2, 3, 4
    
    # Specializations
    specializations: List[str] = field(default_factory=list)  # ["ML/DS", "Web Dev", "Security"]
    
    # Skill levels (1-5)
    skill_levels: Dict[str, int] = field(default_factory=lambda: {
        "competitive_programming": 0,
        "ml_ds": 0,
        "web_dev": 0,
        "security": 0,
        "hardware_robotics": 0,
        "design": 0,
        "open_source": 0
    })
    
    # External Profile Links
    linked_profiles: Dict[str, str] = field(default_factory=lambda: {
        "codeforces": "",
        "codeforces_rating": "",
        "leetcode": "",
        "hackerrank": "",
        "kaggle": "",
        "github": "",
        "linkedin": "",
        "ctftime": "",  # CTF team handle
    })
    
    # Competition History
    saved_competitions: List[str] = field(default_factory=list)  # List of competition IDs
    competitions_entered: List[Dict] = field(default_factory=list)  # [{comp_id, date_entered, status}]
    competitions_won: List[Dict] = field(default_factory=list)  # [{comp_id, placement, date}]
    
    # Portfolio
    portfolio_items: List[str] = field(default_factory=list)  # List of competition IDs to highlight
    portfolio_visibility: bool = True
    
    # Preferences
    difficulty_preference: str = "intermediate"  # beginner, intermediate, advanced, expert
    time_available_weekly: int = 10  # hours
    preferred_categories: List[str] = field(default_factory=list)  # Preferred competition types
    preferred_duration: Optional[str] = None  # "short" (<8 hrs), "medium" (8-48 hrs), "long" (48+ hrs)
    
    # Goals
    goals: List[str] = field(default_factory=list)  # ["Get Google internship", "Improve ML skills"]
    
    # Notifications
    email_notifications: bool = True
    push_notifications: bool = True
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> dict:
        """Convert the UserProfile object to a dictionary."""
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'college': self.college,
            'year': self.year,
            'specializations': self.specializations,
            'skill_levels': self.skill_levels,
            'linked_profiles': self.linked_profiles,
            'saved_competitions': self.saved_competitions,
            'competitions_entered': self.competitions_entered,
            'competitions_won': self.competitions_won,
            'portfolio_items': self.portfolio_items,
            'portfolio_visibility': self.portfolio_visibility,
            'difficulty_preference': self.difficulty_preference,
            'time_available_weekly': self.time_available_weekly,
            'preferred_categories': self.preferred_categories,
            'preferred_duration': self.preferred_duration,
            'goals': self.goals,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'created_at': self.created_at.isoformat(),
            'last_updated': self.last_updated.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'UserProfile':
        """Create a UserProfile object from a dictionary."""
        profile = cls(user_id=data.get('user_id', ''))
        
        # Set basic fields
        for field in ['name', 'email', 'college', 'year', 'specializations',
                     'skill_levels', 'linked_profiles', 'saved_competitions', 'competitions_entered',
                     'competitions_won', 'portfolio_items', 'portfolio_visibility',
                     'difficulty_preference', 'time_available_weekly',
                     'preferred_categories', 'preferred_duration', 'goals',
                     'email_notifications', 'push_notifications']:
            if field in data:
                setattr(profile, field, data[field])
        
        # Handle datetime fields
        if 'created_at' in data and data['created_at']:
            profile.created_at = datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at']
        if 'last_updated' in data and data['last_updated']:
            profile.last_updated = datetime.fromisoformat(data['last_updated']) if isinstance(data['last_updated'], str) else data['last_updated']
        
        return profile
    
    def update_skill_level(self, skill: str, level: int) -> None:
        """Update a specific skill level."""
        if skill in self.skill_levels:
            self.skill_levels[skill] = max(0, min(5, level))  # Clamp between 0-5
            self.last_updated = datetime.now()

    def toggle_saved_competition(self, comp_id: str, save: bool) -> None:
        """Save or unsave a competition."""
        if save:
            if comp_id not in self.saved_competitions:
                self.saved_competitions.append(comp_id)
        else:
            if comp_id in self.saved_competitions:
                self.saved_competitions.remove(comp_id)
        self.last_updated = datetime.now()
    
    def add_competition_entry(self, comp_id: str, status: str = 'registered') -> None:
        """Add a competition entry to the user's history."""
        self.competitions_entered.append({
            'comp_id': comp_id,
            'date_entered': datetime.now().isoformat(),
            'status': status
        })
        self.last_updated = datetime.now()
    
    def add_competition_win(self, comp_id: str, placement: int) -> None:
        """Record a competition win."""
        self.competitions_won.append({
            'comp_id': comp_id,
            'placement': placement,
            'date': datetime.now().isoformat()
        })
        self.last_updated = datetime.now()
