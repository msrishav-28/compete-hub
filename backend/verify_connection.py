import asyncio
import os
import sys
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env vars
load_dotenv()

async def test_connection():
    url = os.getenv("MONGODB_URL")
    if not url:
        print("❌ Error: MONGODB_URL is missing from .env file")
        return False
        
    if "cluster0.example.mongodb.net" in url:
        print("❌ Error: It looks like you still have the default example URL.")
        print("   Please paste your REAL connection string into backend/.env")
        return False

    print(f"🔄 Attempting to connect to MongoDB...")
    
    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
        # Force a connection verification
        await client.admin.command('ping')
        print("✅ SUCCESS: Connected to MongoDB Atlas!")
        return True
    except Exception as e:
        print(f"❌ Connection Failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Did you replace <password> with your actual password?")
        print("2. Did you whitelist IP 0.0.0.0/0 in Atlas Network Access?")
        return False

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_connection())
