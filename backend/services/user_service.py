"""
User service - Business logic for user operations.
Handles user profiles, saved competitions, and analytics.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging

from backend.repositories.user_repository import UserRepository
from backend.repositories.competition_repository import CompetitionRepository
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class UserService:
    """Service layer for user business logic."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.user_repo = UserRepository(db)
        self.competition_repo = CompetitionRepository(db)
        self.db = db
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get or create user profile."""
        user = await self.user_repo.get_or_create(user_id)
        
        # Remove internal fields
        if "_id" in user:
            del user["_id"]
        
        return {
            "success": True,
            "data": user
        }
    
    async def update_user_profile(
        self, 
        user_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user profile with validation."""
        # Filter out None values and empty strings
        clean_updates = {
            k: v for k, v in updates.items() 
            if v is not None and v != ""
        }
        
        if not clean_updates:
            # No updates to apply, just return current profile
            return await self.get_user_profile(user_id)
        
        user = await self.user_repo.update_profile(user_id, clean_updates)
        
        if user and "_id" in user:
            del user["_id"]
        
        return {
            "success": True,
            "data": user,
            "message": "Profile updated successfully"
        }
    
    async def save_competition(
        self, 
        user_id: str, 
        competition_id: str,
        save: bool = True
    ) -> Dict[str, Any]:
        """Save or unsave a competition for a user."""
        # Verify competition exists
        competition = await self.competition_repo.get_by_id(competition_id)
        if not competition and save:
            logger.warning(f"Saving non-existent competition: {competition_id}")
        
        user = await self.user_repo.save_competition(user_id, competition_id, save)
        
        action = "saved" if save else "removed from saved"
        
        return {
            "success": True,
            "data": {
                "saved_competitions": user.get("saved_competitions", []) if user else []
            },
            "message": f"Competition {action} successfully"
        }
    
    async def get_saved_competitions(
        self, 
        user_id: str
    ) -> Dict[str, Any]:
        """Get user's saved competitions with full details."""
        saved_ids = await self.user_repo.get_saved_competitions(user_id)
        
        if not saved_ids:
            return {
                "success": True,
                "data": [],
                "count": 0
            }
        
        # Fetch full competition details
        competitions = await self.competition_repo.get_by_ids(saved_ids)
        
        return {
            "success": True,
            "data": competitions,
            "count": len(competitions)
        }
    
    async def record_win(
        self, 
        user_id: str, 
        competition_id: str, 
        placement: int
    ) -> Dict[str, Any]:
        """Record a competition win/placement."""
        # Verify competition exists
        competition = await self.competition_repo.get_by_id(competition_id)
        if not competition:
            return {
                "success": False,
                "error": "Competition not found"
            }
        
        user = await self.user_repo.add_win(user_id, competition_id, placement)
        
        # Update participation stats
        category = competition.get("category", "other")
        await self.user_repo.update_participation(user_id, category)
        
        return {
            "success": True,
            "data": {
                "wins": user.get("wins", []) if user else []
            },
            "message": f"Placement #{placement} recorded successfully"
        }
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a user."""
        analytics = await self.user_repo.get_analytics(user_id)
        
        # Enrich wins with competition details
        enriched_wins = []
        for win in analytics.get("wins", []):
            comp = await self.competition_repo.get_by_id(win.get("competition_id", ""))
            if comp:
                enriched_wins.append({
                    **win,
                    "competition_title": comp.get("title"),
                    "competition_category": comp.get("category"),
                    "competition_platform": comp.get("platform")
                })
            else:
                enriched_wins.append(win)
        
        analytics["wins"] = enriched_wins
        
        return {
            "success": True,
            "data": analytics
        }
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get quick stats for a user."""
        user = await self.user_repo.get_by_user_id(user_id)
        
        if not user:
            return {
                "success": True,
                "data": {
                    "saved_count": 0,
                    "wins_count": 0,
                    "categories_participated": 0
                }
            }
        
        return {
            "success": True,
            "data": {
                "saved_count": len(user.get("saved_competitions", [])),
                "wins_count": len(user.get("wins", [])),
                "categories_participated": len(user.get("participation_by_category", {}))
            }
        }
