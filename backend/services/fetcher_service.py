"""
Fetcher service - Orchestrates data fetching from external sources.
Manages fetcher lifecycle, caching, and data synchronization.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import logging
import asyncio

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class FetcherService:
    """Service for managing competition data fetching."""
    
    def __init__(self, db: AsyncIOMotorDatabase, fetchers: Dict[str, Any]):
        """
        Initialize fetcher service.
        
        Args:
            db: Database connection
            fetchers: Dict of fetcher instances keyed by source name
        """
        self.db = db
        self.fetchers = fetchers
        self.metadata_collection = db.metadata if db else None
        self.competitions_collection = db.competitions if db else None
    
    async def is_source_fresh(
        self, 
        source: str, 
        ttl_hours: int = 24
    ) -> bool:
        """Check if a source's data is still fresh."""
        if not self.metadata_collection:
            return False
        
        try:
            metadata = await self.metadata_collection.find_one({"_id": source})
            if not metadata:
                return False
            
            last_updated = metadata.get("last_updated")
            if not last_updated:
                return False
            
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated)
            
            return datetime.now() - last_updated < timedelta(hours=ttl_hours)
        except Exception as e:
            logger.warning(f"Error checking source freshness for {source}: {e}")
            return False
    
    async def update_source_metadata(
        self, 
        source: str,
        count: int = 0
    ) -> None:
        """Update the last_updated timestamp for a source."""
        if not self.metadata_collection:
            return
        
        try:
            await self.metadata_collection.update_one(
                {"_id": source},
                {
                    "$set": {
                        "last_updated": datetime.now(),
                        "competition_count": count
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Error updating metadata for {source}: {e}")
    
    async def fetch_from_source(
        self, 
        source: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch competitions from a specific source.
        
        Args:
            source: Source name (e.g., "codeforces", "kaggle")
            force: Force refresh even if cache is fresh
            
        Returns:
            Dict with status and count of fetched competitions
        """
        if source not in self.fetchers:
            return {
                "success": False,
                "error": f"Unknown source: {source}",
                "source": source
            }
        
        # Check if refresh is needed
        if not force and await self.is_source_fresh(source):
            logger.info(f"Source {source} is fresh, skipping fetch")
            return {
                "success": True,
                "source": source,
                "skipped": True,
                "message": "Data is still fresh"
            }
        
        try:
            logger.info(f"Fetching data from {source}...")
            fetcher = self.fetchers[source]
            
            # Run fetcher (may be sync or async)
            if asyncio.iscoroutinefunction(fetcher.run):
                competitions = await fetcher.run()
            else:
                # Run sync fetcher in thread pool
                loop = asyncio.get_event_loop()
                competitions = await loop.run_in_executor(None, fetcher.run)
            
            if not competitions:
                logger.warning(f"No competitions fetched from {source}")
                return {
                    "success": True,
                    "source": source,
                    "count": 0,
                    "message": "No competitions found"
                }
            
            # Store in database
            count = await self._store_competitions(competitions)
            
            # Update metadata
            await self.update_source_metadata(source, count)
            
            logger.info(f"Successfully fetched {count} competitions from {source}")
            
            return {
                "success": True,
                "source": source,
                "count": count,
                "message": f"Fetched {count} competitions"
            }
            
        except Exception as e:
            logger.error(f"Error fetching from {source}: {e}")
            return {
                "success": False,
                "source": source,
                "error": str(e)
            }
    
    async def fetch_all_sources(
        self, 
        force: bool = False,
        sources: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Fetch from all configured sources.
        
        Args:
            force: Force refresh all sources
            sources: Optional list of specific sources to refresh
            
        Returns:
            Dict with results for each source
        """
        target_sources = sources or list(self.fetchers.keys())
        results = {}
        
        total_count = 0
        success_count = 0
        
        for source in target_sources:
            result = await self.fetch_from_source(source, force)
            results[source] = result
            
            if result.get("success"):
                success_count += 1
                total_count += result.get("count", 0)
        
        return {
            "success": True,
            "sources_processed": len(target_sources),
            "sources_successful": success_count,
            "total_competitions": total_count,
            "details": results
        }
    
    async def _store_competitions(
        self, 
        competitions: List[Any]
    ) -> int:
        """Store competitions in database."""
        if not self.competitions_collection:
            return 0
        
        count = 0
        for comp in competitions:
            try:
                # Convert to dict if needed
                if hasattr(comp, "to_dict"):
                    comp_dict = comp.to_dict()
                elif hasattr(comp, "dict"):
                    comp_dict = comp.dict()
                else:
                    comp_dict = comp
                
                comp_id = comp_dict.get("id")
                if not comp_id:
                    logger.warning("Skipping competition without ID")
                    continue
                
                await self.competitions_collection.update_one(
                    {"id": comp_id},
                    {"$set": comp_dict},
                    upsert=True
                )
                count += 1
                
            except Exception as e:
                logger.warning(f"Error storing competition: {e}")
                continue
        
        return count
    
    async def get_source_status(self) -> Dict[str, Any]:
        """Get status of all configured sources."""
        status = {}
        
        for source in self.fetchers.keys():
            is_fresh = await self.is_source_fresh(source)
            
            # Get last update time
            metadata = None
            if self.metadata_collection:
                try:
                    metadata = await self.metadata_collection.find_one({"_id": source})
                except Exception:
                    pass
            
            status[source] = {
                "is_fresh": is_fresh,
                "last_updated": metadata.get("last_updated") if metadata else None,
                "competition_count": metadata.get("competition_count", 0) if metadata else 0
            }
        
        return {
            "success": True,
            "sources": status
        }
    
    def get_available_sources(self) -> List[str]:
        """Get list of available fetcher sources."""
        return list(self.fetchers.keys())
