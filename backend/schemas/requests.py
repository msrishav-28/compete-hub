"""
Request DTOs with validation.
"""
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class UserProfileUpdate(BaseModel):
    """Partial update for the calling user's profile."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    college: Optional[str] = Field(default=None, max_length=200)
    year: Optional[int] = Field(default=None, ge=1, le=6)
    specializations: Optional[List[str]] = Field(default=None, max_length=10)
    skill_levels: Optional[Dict[str, int]] = None
    linked_profiles: Optional[Dict[str, str]] = None
    difficulty_preference: Optional[str] = Field(
        default=None,
        pattern="^(beginner|intermediate|advanced|expert)$",
    )
    time_available_weekly: Optional[int] = Field(default=None, ge=0, le=168)
    preferred_categories: Optional[List[str]] = Field(default=None, max_length=20)
    goals: Optional[List[str]] = Field(default=None, max_length=10)

    @field_validator("skill_levels")
    @classmethod
    def _check_skill_levels(cls, v):
        if v:
            for skill, level in v.items():
                if not 0 <= level <= 5:
                    raise ValueError(f"Skill level for {skill} must be between 0 and 5")
        return v

    class Config:
        extra = "ignore"


class CompetitionSaveRequest(BaseModel):
    comp_id: str = Field(..., min_length=1, max_length=100)
    save: bool


class CompetitionEnterRequest(BaseModel):
    """
    Mark a competition as entered (registered). Existing frontend sends
    a bare JSON-string body — we accept that via a separate path in
    main.py, but new clients should use this proper shape.
    """
    comp_id: str = Field(..., min_length=1, max_length=100)


class CompetitionWinRequest(BaseModel):
    comp_id: str = Field(..., min_length=1, max_length=100)
    placement: int = Field(..., ge=1, le=1000)


class RefreshRequest(BaseModel):
    sources: Optional[List[str]] = Field(default=None, max_length=10)
    force: bool = False
