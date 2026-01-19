"""
User repository for data access operations.
Handles all database operations related to users.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from .base import BaseRepository

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository):
    """Repository for user data access."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users")
    
    async def get_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their user_id."""
        return await self.find_one({"user_id": user_id})
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email."""
        return await self.find_one({"email": email})
    
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user profile."""
        user_data["created_at"] = datetime.now()
        user_data["updated_at"] = datetime.now()
        
        # Ensure required fields
        if "saved_competitions" not in user_data:
            user_data["saved_competitions"] = []
        if "wins" not in user_data:
            user_data["wins"] = []
        if "specializations" not in user_data:
            user_data["specializations"] = []
        if "skill_levels" not in user_data:
            user_data["skill_levels"] = {}
        
        return await self.insert_one(user_data)
    
    async def get_or_create(self, user_id: str) -> Dict[str, Any]:
        """Get existing user or create a new one."""
        user = await self.get_by_user_id(user_id)
        
        if not user:
            default_profile = {
                "user_id": user_id,
                "name": None,
                "email": None,
                "college": None,
                "year": None,
                "specializations": [],
                "skill_levels": {},
                "linked_profiles": {},
                "difficulty_preference": "intermediate",
                "time_available_weekly": 10,
                "preferred_categories": [],
                "goals": [],
                "saved_competitions": [],
                "wins": [],
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await self.insert_one(default_profile)
            user = default_profile
        
        return user
    
    async def update_profile(
        self, 
        user_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update user profile and return updated document."""
        updates["updated_at"] = datetime.now()
        
        await self.update_one(
            {"user_id": user_id},
            {"$set": updates},
            upsert=True
        )
        
        return await self.get_by_user_id(user_id)
    
    async def save_competition(
        self, 
        user_id: str, 
        competition_id: str,
        save: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Save or unsave a competition for a user."""
        if save:
            # Add to saved_competitions if not already there
            await self.collection.update_one(
                {"user_id": user_id},
                {
                    "$addToSet": {"saved_competitions": competition_id},
                    "$set": {"updated_at": datetime.now()}
                },
                upsert=True
            )
        else:
            # Remove from saved_competitions
            await self.collection.update_one(
                {"user_id": user_id},
                {
                    "$pull": {"saved_competitions": competition_id},
                    "$set": {"updated_at": datetime.now()}
                }
            )
        
        return await self.get_by_user_id(user_id)
    
    async def get_saved_competitions(self, user_id: str) -> List[str]:
        """Get list of saved competition IDs for a user."""
        user = await self.get_by_user_id(user_id)
        if not user:
            return []
        return user.get("saved_competitions", [])
    
    async def add_win(
        self, 
        user_id: str, 
        competition_id: str, 
        placement: int
    ) -> Optional[Dict[str, Any]]:
        """Record a competition win/placement."""
        win_record = {
            "competition_id": competition_id,
            "placement": placement,
            "recorded_at": datetime.now().isoformat()
        }
        
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"wins": win_record},
                "$set": {"updated_at": datetime.now()}
            },
            upsert=True
        )
        
        return await self.get_by_user_id(user_id)
    
    async def get_wins(self, user_id: str) -> List[Dict[str, Any]]:
        """Get list of wins for a user."""
        user = await self.get_by_user_id(user_id)
        if not user:
            return []
        return user.get("wins", [])
    
    async def get_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get user analytics data."""
        user = await self.get_by_user_id(user_id)
        
        if not user:
            return {
                "total_competitions_entered": 0,
                "wins": [],
                "participation_by_category": {},
                "skill_progress": {},
                "recommendations_summary": {}
            }
        
        return {
            "total_competitions_entered": len(user.get("saved_competitions", [])),
            "wins": user.get("wins", []),
            "participation_by_category": user.get("participation_by_category", {}),
            "skill_progress": user.get("skill_levels", {}),
            "recommendations_summary": {
                "preferred_categories": user.get("preferred_categories", []),
                "difficulty_preference": user.get("difficulty_preference"),
                "specializations": user.get("specializations", [])
            }
        }
    
    async def update_participation(
        self, 
        user_id: str, 
        category: str
    ) -> None:
        """Increment participation count for a category."""
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$inc": {f"participation_by_category.{category}": 1},
                "$set": {"updated_at": datetime.now()}
            },
            upsert=True
        )
