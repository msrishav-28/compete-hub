"""
Database connection management using centralized config.
Single source of truth for MongoDB connection.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from backend.core.config import settings

logger = logging.getLogger(__name__)

# Global connection state
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def validate_environment() -> bool:
    """Validate database configuration at startup."""
    if not settings.mongodb_url:
        logger.error("MONGODB_URL is not set")
        return False
    return True


async def connect_to_mongo() -> bool:
    """Establish connection to MongoDB."""
    global _client, _db
    
    if not validate_environment():
        logger.warning("Database connection skipped - invalid configuration")
        return False

    try:
        logger.info("Connecting to MongoDB...")
        _client = AsyncIOMotorClient(settings.mongodb_url, **settings.mongo_options)
        _db = _client[settings.db_name]
        
        # Verify connection
        await _client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.db_name}")
        
        # Create indexes
        await create_indexes()
        return True
        
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        _client = None
        _db = None
        raise


async def create_indexes():
    """Create database indexes for optimized queries."""
    if _db is None:
        return
        
    try:
        # Competitions indexes
        await _db.competitions.create_index("id", unique=True)
        await _db.competitions.create_index("category")
        await _db.competitions.create_index("difficulty")
        await _db.competitions.create_index("platform")
        await _db.competitions.create_index("start_date")
        await _db.competitions.create_index([("title", "text"), ("description", "text")])
        
        # Users indexes
        await _db.users.create_index("user_id", unique=True)
        await _db.users.create_index("email", sparse=True)
        
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation error (non-fatal): {e}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Get database instance."""
    return _db


def is_connected() -> bool:
    """Check if database is connected."""
    return _db is not None


def get_competitions_collection():
    """Get competitions collection."""
    return _db.competitions if _db else None


def get_users_collection():
    """Get users collection."""
    return _db.users if _db else None


def get_metadata_collection():
    """Get metadata collection."""
    return _db.metadata if _db else None
