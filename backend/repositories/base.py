"""
Base repository with common CRUD operations.
All repositories should inherit from this base class.
"""
from typing import Any, Dict, Generic, List, Optional, TypeVar
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
import logging

T = TypeVar('T')

logger = logging.getLogger(__name__)


class BaseRepository(Generic[T]):
    """
    Base repository providing common CRUD operations.
    Abstracts direct database access from business logic.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.db = db
        self.collection: AsyncIOMotorCollection = db[collection_name]
        self.collection_name = collection_name
    
    async def find_one(
        self, 
        filter_dict: Dict[str, Any], 
        projection: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Find a single document matching the filter."""
        try:
            projection = projection or {"_id": 0}
            return await self.collection.find_one(filter_dict, projection)
        except Exception as e:
            logger.error(f"Error finding document in {self.collection_name}: {e}")
            raise
    
    async def find_many(
        self,
        filter_dict: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
        sort: Optional[List[tuple]] = None,
        limit: Optional[int] = None,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Find multiple documents with optional pagination and sorting."""
        try:
            filter_dict = filter_dict or {}
            projection = projection or {"_id": 0}
            
            cursor = self.collection.find(filter_dict, projection)
            
            if sort:
                cursor = cursor.sort(sort)
            
            if skip > 0:
                cursor = cursor.skip(skip)
            
            if limit:
                cursor = cursor.limit(limit)
            
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Error finding documents in {self.collection_name}: {e}")
            raise
    
    async def count(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        """Count documents matching the filter."""
        try:
            filter_dict = filter_dict or {}
            return await self.collection.count_documents(filter_dict)
        except Exception as e:
            logger.error(f"Error counting documents in {self.collection_name}: {e}")
            raise
    
    async def insert_one(self, document: Dict[str, Any]) -> str:
        """Insert a single document."""
        try:
            result = await self.collection.insert_one(document)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error inserting document in {self.collection_name}: {e}")
            raise
    
    async def insert_many(self, documents: List[Dict[str, Any]]) -> List[str]:
        """Insert multiple documents."""
        try:
            result = await self.collection.insert_many(documents)
            return [str(id) for id in result.inserted_ids]
        except Exception as e:
            logger.error(f"Error inserting documents in {self.collection_name}: {e}")
            raise
    
    async def update_one(
        self,
        filter_dict: Dict[str, Any],
        update_dict: Dict[str, Any],
        upsert: bool = False
    ) -> bool:
        """Update a single document."""
        try:
            # Ensure $set is used if not already
            if not any(key.startswith('$') for key in update_dict.keys()):
                update_dict = {"$set": update_dict}
            
            result = await self.collection.update_one(
                filter_dict, 
                update_dict, 
                upsert=upsert
            )
            return result.modified_count > 0 or result.upserted_id is not None
        except Exception as e:
            logger.error(f"Error updating document in {self.collection_name}: {e}")
            raise
    
    async def upsert_one(
        self,
        filter_dict: Dict[str, Any],
        document: Dict[str, Any]
    ) -> bool:
        """Upsert (insert or update) a single document."""
        return await self.update_one(filter_dict, document, upsert=True)
    
    async def delete_one(self, filter_dict: Dict[str, Any]) -> bool:
        """Delete a single document."""
        try:
            result = await self.collection.delete_one(filter_dict)
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting document in {self.collection_name}: {e}")
            raise
    
    async def delete_many(self, filter_dict: Dict[str, Any]) -> int:
        """Delete multiple documents."""
        try:
            result = await self.collection.delete_many(filter_dict)
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting documents in {self.collection_name}: {e}")
            raise
    
    async def exists(self, filter_dict: Dict[str, Any]) -> bool:
        """Check if a document exists."""
        try:
            count = await self.collection.count_documents(filter_dict, limit=1)
            return count > 0
        except Exception as e:
            logger.error(f"Error checking existence in {self.collection_name}: {e}")
            raise
    
    async def aggregate(self, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run an aggregation pipeline."""
        try:
            cursor = self.collection.aggregate(pipeline)
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error in aggregation for {self.collection_name}: {e}")
            raise
