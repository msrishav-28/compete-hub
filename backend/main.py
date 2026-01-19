"""
CompeteHub API - Clean Architecture
Routes only - business logic delegated to services layer.
"""
from fastapi import FastAPI, HTTPException, Depends, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
from contextlib import asynccontextmanager
import logging
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Core imports
from backend.core.config import settings
from backend.core.dependencies import require_db

# Schema imports
from backend.schemas.requests import (
    UserProfileUpdate,
    CompetitionSaveRequest,
    CompetitionWinRequest,
)

# Database imports
from backend.database import (
    connect_to_mongo,
    close_mongo_connection,
    get_database,
    is_connected,
)

# Service imports
from backend.services.competition_service import CompetitionService
from backend.services.user_service import UserService
from backend.services.recommendation_service import RecommendationService
from backend.services.fetcher_service import FetcherService

# Fetcher imports
from fetchers.coding_contests.codeforces import CodeforcesFetcher
from fetchers.data_science.kaggle import KaggleFetcher
from fetchers.corporate.hackerrank import HackerRankFetcher
from fetchers.hackathons.hackalist import HackalistFetcher

# Model imports
from models.user_profile import UserProfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize fetchers
FETCHERS = {
    "codeforces": CodeforcesFetcher(),
    "kaggle": KaggleFetcher(),
    "hackerrank": HackerRankFetcher(),
    "hackalist": HackalistFetcher()
}


# ===== DEPENDENCY INJECTION =====

def get_competition_service() -> CompetitionService:
    """Get competition service instance."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return CompetitionService(db)


def get_user_service() -> UserService:
    """Get user service instance."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return UserService(db)


def get_recommendation_service() -> RecommendationService:
    """Get recommendation service instance."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return RecommendationService(db)


def get_fetcher_service() -> FetcherService:
    """Get fetcher service instance."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return FetcherService(db, FETCHERS)


# ===== LIFESPAN =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    try:
        await connect_to_mongo()
        # Pre-fetch competitions on startup
        if is_connected():
            fetcher_svc = FetcherService(get_database(), FETCHERS)
            await fetcher_svc.fetch_all_sources(force=False)
    except Exception as e:
        logger.error(f"Startup error: {e}")
    yield
    await close_mongo_connection()


# ===== APP INITIALIZATION =====

app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)


# ===== EXCEPTION HANDLER =====

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    detail = str(exc) if settings.is_development else "An unexpected error occurred"
    return JSONResponse(status_code=500, content={"success": False, "error": detail})


# ===== COMPETITION ENDPOINTS =====

@app.get("/api/competitions")
async def get_competitions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    time_commitment: Optional[str] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    platform: Optional[str] = Query(None),
    recruitment_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: CompetitionService = Depends(get_competition_service)
):
    """Get filtered and paginated competitions."""
    return await service.get_competitions(
        category=category,
        difficulty=difficulty,
        time_commitment=time_commitment,
        platform=platform,
        recruitment_only=recruitment_only,
        search=search,
        limit=limit,
        offset=offset
    )


@app.get("/api/competitions/upcoming/week")
async def get_upcoming_week(
    service: CompetitionService = Depends(get_competition_service)
):
    """Get competitions starting in the next 7 days."""
    return await service.get_upcoming_week()


@app.get("/api/competitions/{competition_id}")
async def get_competition_by_id(
    competition_id: str,
    service: CompetitionService = Depends(get_competition_service)
):
    """Get a single competition by ID."""
    comp = await service.get_competition_by_id(competition_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    return {"success": True, "data": comp}


@app.get("/api/stats/overview")
async def get_stats_overview(
    service: CompetitionService = Depends(get_competition_service)
):
    """Get competition statistics."""
    return await service.get_stats_overview()


# ===== USER ENDPOINTS =====

@app.get("/api/users/profile")
async def get_profile(
    user_id: str = Query("default_user", max_length=100),
    service: UserService = Depends(get_user_service)
):
    """Get user profile."""
    return await service.get_user_profile(user_id)


@app.post("/api/users/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    user_id: str = Query("default_user", max_length=100),
    service: UserService = Depends(get_user_service)
):
    """Create or update user profile."""
    updates = profile_update.dict(exclude_unset=True)
    return await service.update_user_profile(user_id, updates)


@app.post("/api/users/competition/save")
async def save_competition(
    request: CompetitionSaveRequest,
    user_id: str = Query("default_user", max_length=100),
    service: UserService = Depends(get_user_service)
):
    """Save or unsave a competition."""
    return await service.save_competition(user_id, request.comp_id, request.save)


@app.post("/api/users/competition/enter")
async def enter_competition(
    comp_id: str = Body(..., embed=True),
    user_id: str = Query("default_user", max_length=100),
):
    """Mark a competition as entered."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    users_col = db.users
    user = await users_col.find_one({"user_id": user_id})
    
    if user:
        profile = UserProfile.from_dict(user)
    else:
        profile = UserProfile(user_id=user_id)
    
    profile.add_competition_entry(comp_id.strip().strip('"'), status='registered')
    
    await users_col.update_one(
        {"user_id": user_id},
        {"$set": profile.to_dict()},
        upsert=True
    )
    
    return {"success": True, "message": "Competition entry recorded"}


@app.post("/api/users/competition/win")
async def record_win(
    request: CompetitionWinRequest,
    user_id: str = Query("default_user", max_length=100),
    service: UserService = Depends(get_user_service)
):
    """Record a competition win."""
    return await service.record_win(user_id, request.comp_id, request.placement)


# ===== RECOMMENDATION ENDPOINTS =====

@app.get("/api/recommendations")
async def get_recommendations(
    user_id: str = Query("default_user", max_length=100),
    limit: int = Query(10, ge=1, le=50),
    service: RecommendationService = Depends(get_recommendation_service)
):
    """Get personalized competition recommendations."""
    return await service.get_recommendations(user_id, limit)


# ===== ANALYTICS ENDPOINTS =====

@app.get("/api/analytics/user")
async def get_user_analytics(
    user_id: str = Query("default_user", max_length=100),
    service: UserService = Depends(get_user_service)
):
    """Get user's competition analytics."""
    return await service.get_user_analytics(user_id)


# ===== REFRESH ENDPOINT =====

@app.post("/api/refresh")
async def refresh_competitions(
    service: FetcherService = Depends(get_fetcher_service)
):
    """Manually trigger a refresh of all competitions."""
    result = await service.fetch_all_sources(force=True)
    result["timestamp"] = datetime.now().isoformat()
    return result


# ===== HEALTH CHECK =====

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_connected = is_connected()
    
    if db_connected:
        try:
            db = get_database()
            await db.command('ping')
        except Exception:
            db_connected = False
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.api_version,
        "environment": settings.environment,
        "database": {"connected": db_connected, "name": settings.db_name},
        "fetchers": {"count": len(FETCHERS), "sources": list(FETCHERS.keys())}
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "documentation": "/docs",
        "health": "/health"
    }


# ===== RUN =====

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=settings.is_development)

