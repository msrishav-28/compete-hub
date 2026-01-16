import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = "competehub"

client = None
db = None

async def connect_to_mongo():
    global client, db
    if not MONGODB_URL:
        # Fallback for local dev without DB if needed, or raise error
        print("WARNING: MONGODB_URL not found in environment variables.")
        return

    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DB_NAME]
        # Verify connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_database():
    return db

# Collection helpers
def get_competitions_collection():
    if db is not None:
        return db.competitions
    return None

def get_users_collection():
    if db is not None:
        return db.users
    return None
