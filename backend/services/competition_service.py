"""
Competition service - Business logic for competition operations.
Orchestrates between repositories, fetchers, and external services.
"""
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

from backend.repositories.competition_repository import CompetitionRepository
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class CompetitionService:
    """Service layer for competition business logic."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.repository = CompetitionRepository(db)
        self.db = db
    
    async def get_competitions(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        time_commitment: Optional[str] = None,
        platform: Optional[str] = None,
        recruitment_only: bool = False,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get filtered and paginated competitions.
        Returns response dict with pagination metadata.
        """
        competitions, total = await self.repository.get_filtered(
            category=category,
            difficulty=difficulty,
            time_commitment=time_commitment,
            platform=platform,
            recruitment_only=recruitment_only,
            search=search,
            limit=limit,
            skip=offset
        )
        
        return {
            "success": True,
            "data": competitions,
            "total": total,
            "limit": limit,
            "offset": offset,
            "page": offset // limit + 1 if limit > 0 else 1,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        }
    
    async def get_competition_by_id(
        self, 
        competition_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a single competition by ID."""
        return await self.repository.get_by_id(competition_id)
    
    async def get_upcoming_week(self) -> Dict[str, Any]:
        """Get competitions starting in the next 7 days."""
        upcoming = await self.repository.get_upcoming(days=7)
        
        return {
            "success": True,
            "data": upcoming,
            "count": len(upcoming)
        }
    
    async def get_stats_overview(self) -> Dict[str, Any]:
        """Get overview statistics about competitions."""
        stats = await self.repository.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    
    async def get_competitions_by_ids(
        self, 
        competition_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Get multiple competitions by their IDs."""
        return await self.repository.get_by_ids(competition_ids)
    
    async def sync_competitions(
        self, 
        competitions: List[Dict[str, Any]]
    ) -> int:
        """
        Sync competitions to database.
        Returns count of upserted competitions.
        """
        return await self.repository.upsert_many(competitions)
    
    async def search_competitions(
        self, 
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Full-text search on competitions."""
        return await self.repository.search_text(query, limit)
    
    async def get_categories_summary(self) -> Dict[str, int]:
        """Get count of competitions per category."""
        stats = await self.repository.get_stats()
        return stats.get("categories", {})
    
    async def get_platforms_summary(self) -> Dict[str, int]:
        """Get count of competitions per platform."""
        stats = await self.repository.get_stats()
        return stats.get("platforms", {})
