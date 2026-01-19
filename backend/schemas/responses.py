"""
Response DTOs for consistent API responses.
All outgoing responses should follow these schemas.
"""
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper."""
    success: bool = True
    data: T
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    success: bool = True
    data: List[T]
    total: int
    limit: int
    offset: int
    page: int
    total_pages: int


class CompetitionResponse(BaseModel):
    """Competition data response."""
    id: str
    title: str
    platform: str
    category: str
    description: Optional[str] = None
    url: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    difficulty: Optional[str] = None
    time_commitment: Optional[str] = None
    prize: Optional[Dict[str, Any]] = None
    skills_required: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    recruitment_potential: bool = False
    companies_recruiting: List[str] = Field(default_factory=list)
    
    class Config:
        extra = "allow"


class UserProfileResponse(BaseModel):
    """User profile response."""
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    college: Optional[str] = None
    year: Optional[int] = None
    specializations: List[str] = Field(default_factory=list)
    skill_levels: Dict[str, int] = Field(default_factory=dict)
    linked_profiles: Dict[str, str] = Field(default_factory=dict)
    difficulty_preference: Optional[str] = None
    time_available_weekly: Optional[int] = None
    preferred_categories: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    saved_competitions: List[str] = Field(default_factory=list)
    wins: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        extra = "allow"


class StatsResponse(BaseModel):
    """Statistics response."""
    total: int
    categories: Dict[str, int]
    difficulties: Dict[str, int]
    platforms: Dict[str, int]


class RecommendationResponse(BaseModel):
    """Recommendation with score."""
    competition: Dict[str, Any]
    score: float
    reasons: List[str]


class AnalyticsResponse(BaseModel):
    """User analytics response."""
    total_competitions_entered: int
    wins: List[Dict[str, Any]]
    participation_by_category: Dict[str, int]
    skill_progress: Dict[str, Any]
    recommendations_summary: Dict[str, Any]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str
    timestamp: str
    version: str
    environment: str
