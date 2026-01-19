"""
Request DTOs with validation.
All incoming request data should be validated through these schemas.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    college: Optional[str] = Field(None, max_length=200)
    year: Optional[int] = Field(None, ge=1, le=6)
    specializations: Optional[List[str]] = Field(None, max_items=10)
    skill_levels: Optional[Dict[str, int]] = None
    linked_profiles: Optional[Dict[str, str]] = None
    difficulty_preference: Optional[str] = Field(
        None, 
        pattern="^(beginner|intermediate|advanced|expert)$"
    )
    time_available_weekly: Optional[int] = Field(None, ge=0, le=168)
    preferred_categories: Optional[List[str]] = Field(None, max_items=20)
    goals: Optional[List[str]] = Field(None, max_items=10)
    
    @validator('skill_levels')
    def validate_skill_levels(cls, v):
        if v:
            for skill, level in v.items():
                if not 0 <= level <= 5:
                    raise ValueError(f"Skill level for {skill} must be between 0 and 5")
        return v
    
    class Config:
        extra = "ignore"


class CompetitionSaveRequest(BaseModel):
    """Schema for saving/unsaving a competition."""
    comp_id: str = Field(..., min_length=1, max_length=100)
    save: bool


class CompetitionWinRequest(BaseModel):
    """Schema for marking a competition as won."""
    comp_id: str = Field(..., min_length=1, max_length=100)
    placement: int = Field(..., ge=1, le=1000)


class CompetitionFilterParams(BaseModel):
    """Schema for competition filtering parameters."""
    category: Optional[str] = None
    difficulty: Optional[str] = Field(
        None, 
        pattern="^(beginner|intermediate|advanced|expert|mixed)$"
    )
    time_commitment: Optional[str] = Field(
        None, 
        pattern="^(low|medium|high)$"
    )
    search: Optional[str] = Field(None, max_length=200)
    platform: Optional[str] = Field(None, max_length=50)
    recruitment_only: bool = False
    limit: int = Field(100, ge=1, le=500)
    offset: int = Field(0, ge=0)
    
    class Config:
        extra = "ignore"


class RefreshRequest(BaseModel):
    """Schema for refresh request."""
    sources: Optional[List[str]] = Field(None, max_items=10)
    force: bool = False
