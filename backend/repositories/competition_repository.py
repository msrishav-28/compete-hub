"""
Competition repository for data access operations.
Handles all database operations related to competitions.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from .base import BaseRepository

logger = logging.getLogger(__name__)


class CompetitionRepository(BaseRepository):
    """Repository for competition data access."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "competitions")
    
    async def get_by_id(self, competition_id: str) -> Optional[Dict[str, Any]]:
        """Get a competition by its ID."""
        return await self.find_one({"id": competition_id})
    
    async def get_all(
        self,
        limit: Optional[int] = None,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all competitions with pagination."""
        return await self.find_many(
            filter_dict={},
            sort=[("start_date", 1)],
            limit=limit,
            skip=skip
        )
    
    async def get_filtered(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        time_commitment: Optional[str] = None,
        platform: Optional[str] = None,
        recruitment_only: bool = False,
        search: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get filtered competitions with total count.
        Returns (competitions, total_count) tuple.
        """
        # Build filter
        filter_dict: Dict[str, Any] = {}
        
        if category:
            filter_dict["category"] = category
        
        if difficulty:
            filter_dict["difficulty"] = difficulty
        
        if time_commitment:
            filter_dict["time_commitment"] = time_commitment
        
        if platform:
            filter_dict["platform"] = {"$regex": f"^{platform}$", "$options": "i"}
        
        if recruitment_only:
            filter_dict["recruitment_potential"] = True
        
        # For text search, use regex (text index would be better for production)
        if search:
            search_lower = search.lower()
            filter_dict["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"platform": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await self.count(filter_dict)
        
        # Get paginated results
        competitions = await self.find_many(
            filter_dict=filter_dict,
            sort=[("start_date", 1)],
            limit=limit,
            skip=skip
        )
        
        return competitions, total
    
    async def get_by_ids(self, competition_ids: List[str]) -> List[Dict[str, Any]]:
        """Get multiple competitions by their IDs."""
        if not competition_ids:
            return []
        return await self.find_many({"id": {"$in": competition_ids}})
    
    async def get_upcoming(
        self, 
        days: int = 7,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get competitions starting within the specified days."""
        now = datetime.now()
        end_date = now.isoformat()
        
        # Build date range filter
        filter_dict = {
            "start_date": {"$gte": now.isoformat()}
        }
        
        competitions = await self.find_many(
            filter_dict=filter_dict,
            sort=[("start_date", 1)],
            limit=limit
        )
        
        # Filter by date range (since MongoDB date comparison can be tricky with ISO strings)
        from datetime import timedelta
        end_threshold = now + timedelta(days=days)
        
        filtered = []
        for comp in competitions:
            start_date_str = comp.get("start_date")
            if start_date_str:
                try:
                    if isinstance(start_date_str, str):
                        start_date = datetime.fromisoformat(
                            start_date_str.replace("Z", "+00:00")
                        )
                    else:
                        start_date = start_date_str
                    
                    if now <= start_date <= end_threshold:
                        filtered.append(comp)
                except (ValueError, TypeError):
                    continue
        
        return filtered
    
    async def get_by_category(
        self, 
        category: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get competitions by category."""
        return await self.find_many(
            filter_dict={"category": category},
            sort=[("start_date", 1)],
            limit=limit
        )
    
    async def upsert_competition(self, competition: Dict[str, Any]) -> bool:
        """Insert or update a competition."""
        comp_id = competition.get("id")
        if not comp_id:
            logger.warning("Cannot upsert competition without ID")
            return False
        
        return await self.upsert_one({"id": comp_id}, competition)
    
    async def upsert_many(self, competitions: List[Dict[str, Any]]) -> int:
        """Bulk upsert competitions. Returns count of successful operations."""
        count = 0
        for comp in competitions:
            try:
                if await self.upsert_competition(comp):
                    count += 1
            except Exception as e:
                logger.warning(f"Failed to upsert competition {comp.get('id')}: {e}")
                continue
        return count
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get competition statistics using aggregation."""
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "categories": {"$push": "$category"},
                    "difficulties": {"$push": "$difficulty"},
                    "platforms": {"$push": "$platform"}
                }
            }
        ]
        
        results = await self.aggregate(pipeline)
        
        if not results:
            return {
                "total": 0,
                "categories": {},
                "difficulties": {},
                "platforms": {}
            }
        
        result = results[0]
        
        # Count occurrences
        def count_items(items: List) -> Dict[str, int]:
            counts = {}
            for item in items:
                if item:
                    counts[item] = counts.get(item, 0) + 1
            return counts
        
        return {
            "total": result.get("total", 0),
            "categories": count_items(result.get("categories", [])),
            "difficulties": count_items(result.get("difficulties", [])),
            "platforms": count_items(result.get("platforms", []))
        }
    
    async def search_text(
        self, 
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Full-text search on competitions.
        Requires text index on title and description.
        """
        try:
            # Try text search first
            cursor = self.collection.find(
                {"$text": {"$search": query}},
                {"_id": 0, "score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            return await cursor.to_list(length=limit)
        except Exception:
            # Fallback to regex search if text index not available
            logger.debug("Falling back to regex search")
            return await self.find_many(
                filter_dict={
                    "$or": [
                        {"title": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}}
                    ]
                },
                limit=limit
            )
