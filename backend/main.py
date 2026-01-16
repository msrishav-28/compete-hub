from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import os
import sys
import json
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.competition import Competition, CompetitionCategory, DifficultyLevel
from models.user_profile import UserProfile
from utils.cache import cache
from fetchers.coding_contests.codeforces import CodeforcesFetcher
from fetchers.data_science.kaggle import KaggleFetcher
from fetchers.corporate.hackerrank import HackerRankFetcher
from fetchers.hackathons.hackalist import HackalistFetcher

app = FastAPI(
    title="CompeteHub API",
    description="Comprehensive API for discovering, tracking, and analyzing competitions",
    version="2.0.0"
)

# CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize fetchers
FETCHERS = {
    "codeforces": CodeforcesFetcher(),
    "kaggle": KaggleFetcher(),
    "hackerrank": HackerRankFetcher(),
    "hackalist": HackalistFetcher()
}

# Pydantic models for requests
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    college: Optional[str] = None
    year: Optional[int] = None
    specializations: Optional[List[str]] = None
    skill_levels: Optional[Dict[str, int]] = None
    linked_profiles: Optional[Dict[str, str]] = None
    difficulty_preference: Optional[str] = None
    time_available_weekly: Optional[int] = None
    preferred_categories: Optional[List[str]] = None
    goals: Optional[List[str]] = None

# ===== COMPETITION ENDPOINTS =====

def load_all_competitions() -> List[Dict[str, Any]]:
    """Load all competitions from cache or fetch if needed"""
    all_competitions = []
    
    for source, fetcher in FETCHERS.items():
        try:
            if not cache.is_cache_fresh(source, ttl_hours=24):
                print(f"Fetching fresh data from {source}...")
                competitions = fetcher.run()
                cache.save_competitions(competitions, source)
            
            # Load from cache
            cached_comps = cache.load_competitions(source)
            if isinstance(cached_comps, list):
                all_competitions.extend(cached_comps)
        except Exception as e:
            print(f"Error loading from {source}: {str(e)}")
            continue
    
    return all_competitions

@app.get("/api/competitions")
async def get_competitions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    time_commitment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    recruitment_only: Optional[bool] = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Get filtered and paginated list of competitions.
    Supports filtering by category, difficulty, time commitment, platform, and search.
    """
    try:
        all_comps = load_all_competitions()
        
        # Apply filters
        filtered = all_comps
        
        if search:
            search_lower = search.lower()
            filtered = [
                c for c in filtered
                if (search_lower in c.get('title', '').lower() or
                    search_lower in c.get('description', '').lower() or
                    search_lower in c.get('platform', '').lower() or
                    any(search_lower in tag.lower() for tag in c.get('tags', [])))
            ]
        
        if category:
            filtered = [c for c in filtered if c.get('category') == category]
        
        if difficulty:
            filtered = [c for c in filtered if c.get('difficulty') == difficulty]
        
        if time_commitment:
            filtered = [c for c in filtered if c.get('time_commitment') == time_commitment]
        
        if platform:
            filtered = [c for c in filtered if c.get('platform') == platform]
        
        if recruitment_only:
            filtered = [c for c in filtered if c.get('recruitment_potential', False)]
        
        # Sort by start date (upcoming first)
        filtered.sort(key=lambda x: x.get('start_date', ''), reverse=False)
        
        # Pagination
        total = len(filtered)
        paginated = filtered[offset:offset + limit]
        
        return {
            "success": True,
            "data": paginated,
            "total": total,
            "limit": limit,
            "offset": offset,
            "page": offset // limit + 1,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching competitions: {str(e)}")

@app.get("/api/competitions/{competition_id}")
async def get_competition_by_id(competition_id: str):
    """Get a single competition by ID"""
    try:
        all_comps = load_all_competitions()
        comp = next((c for c in all_comps if c.get('id') == competition_id), None)
        
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        return {"success": True, "data": comp}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/competitions/upcoming/week")
async def get_upcoming_week():
    """Get competitions starting in the next 7 days"""
    try:
        all_comps = load_all_competitions()
        now = datetime.now()
        week_later = now + timedelta(days=7)
        
        upcoming = [
            c for c in all_comps
            if c.get('start_date') and 
            now.isoformat() <= c.get('start_date') <= week_later.isoformat()
        ]
        
        upcoming.sort(key=lambda x: x.get('start_date', ''))
        
        return {"success": True, "data": upcoming, "count": len(upcoming)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/overview")
async def get_stats_overview():
    """Get overview statistics about competitions"""
    try:
        all_comps = load_all_competitions()
        
        # Calculate statistics
        total = len(all_comps)
        
        categories = {}
        difficulties = {}
        platforms = {}
        
        for comp in all_comps:
            cat = comp.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
            
            diff = comp.get('difficulty', 'unknown')
            difficulties[diff] = difficulties.get(diff, 0) + 1
            
            plat = comp.get('platform', 'unknown')
            platforms[plat] = platforms.get(plat, 0) + 1
        
        return {
            "success": True,
            "data": {
                "total_competitions": total,
                "by_category": categories,
                "by_difficulty": difficulties,
                "by_platform": platforms,
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== USER PROFILE ENDPOINTS =====

USERS_DIR = Path("data/users")
USERS_DIR.mkdir(parents=True, exist_ok=True)

@app.post("/api/users/profile")
async def create_or_update_profile(profile_update: UserProfileUpdate, user_id: str = Query("default_user")):
    """Create or update user profile"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        
        # Load existing profile or create new
        if user_file.exists():
            with open(user_file, 'r') as f:
                existing_data = json.load(f)
            profile = UserProfile.from_dict(existing_data)
        else:
            profile = UserProfile(user_id=user_id)
        
        # Update fields
        update_dict = profile_update.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        profile.last_updated = datetime.now()
        
        # Save
        with open(user_file, 'w') as f:
            json.dump(profile.to_dict(), f, indent=2)
        
        return {"success": True, "message": "Profile updated successfully", "data": profile.to_dict()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/profile")
async def get_profile(user_id: str = Query("default_user")):
    """Get user profile"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        
        if not user_file.exists():
            # Return default profile
            profile = UserProfile(user_id=user_id)
            return {"success": True, "data": profile.to_dict(), "is_new": True}
        
        with open(user_file, 'r') as f:
            profile_data = json.load(f)
        
        return {"success": True, "data": profile_data, "is_new": False}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/competition/save")
async def toggle_save_competition(comp_id: str = Body(..., embed=True), save: bool = Body(..., embed=True), user_id: str = Query("default_user")):
    """Save or unsave a competition"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        
        if user_file.exists():
            with open(user_file, 'r') as f:
                profile_data = json.load(f)
            profile = UserProfile.from_dict(profile_data)
        else:
            profile = UserProfile(user_id=user_id)
        
        profile.toggle_saved_competition(comp_id, save)
        
        with open(user_file, 'w') as f:
            json.dump(profile.to_dict(), f, indent=2)
        
        return {"success": True, "message": f"Competition {'saved' if save else 'unsaved'}", "saved_competitions": profile.saved_competitions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/competition/enter")
async def enter_competition(comp_id: str = Body(...), user_id: str = Query("default_user")):
    """Mark a competition as entered"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        
        if user_file.exists():
            with open(user_file, 'r') as f:
                profile_data = json.load(f)
            profile = UserProfile.from_dict(profile_data)
        else:
            profile = UserProfile(user_id=user_id)
        
        profile.add_competition_entry(comp_id, status='registered')
        
        with open(user_file, 'w') as f:
            json.dump(profile.to_dict(), f, indent=2)
        
        return {"success": True, "message": "Competition entry recorded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/competition/win")
async def record_win(comp_id: str = Body(...), placement: int = Body(...), user_id: str = Query("default_user")):
    """Record a competition win"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        
        if user_file.exists():
            with open(user_file, 'r') as f:
                profile_data = json.load(f)
            profile = UserProfile.from_dict(profile_data)
        else:
            profile = UserProfile(user_id=user_id)
        
        profile.add_competition_win(comp_id, placement)
        
        with open(user_file, 'w') as f:
            json.dump(profile.to_dict(), f, indent=2)
        
        return {"success": True, "message": "Win recorded successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== RECOMMENDATION ENDPOINTS =====

@app.get("/api/recommendations")
async def get_recommendations(user_id: str = Query("default_user"), limit: int = Query(10, ge=1, le=50)):
    """Get personalized competition recommendations"""
    try:
        # Load user profile
        user_file = USERS_DIR / f"{user_id}.json"
        if not user_file.exists():
            return {"success": False, "message": "Profile not found. Please complete your profile first."}
        
        with open(user_file, 'r') as f:
            profile_data = json.load(f)
        
        # Load all competitions
        all_comps = load_all_competitions()
        
        # Simple recommendation algorithm
        scored_comps = []
        for comp in all_comps:
            score = 0
            
            # Category match (30 points)
            user_specs = [s.lower().replace("/", "_") for s in profile_data.get('specializations', [])]
            if comp.get('category') in user_specs:
                score += 30
            
            # Difficulty match (25 points)
            user_diff = profile_data.get('difficulty_preference', 'intermediate')
            if comp.get('difficulty') == user_diff:
                score += 25
            
            # Time commitment match (20 points)
            user_time = profile_data.get('time_available_weekly', 10)
            comp_time = comp.get('time_commitment', 'medium')
            if comp_time == 'low' and user_time >= 3:
                score += 20
            elif comp_time == 'medium' and user_time >= 10:
                score += 20
            elif comp_time == 'high' and user_time >= 20:
                score += 20
            
            # Recruitment potential (25 points)
            if comp.get('recruitment_potential', False):
                score += 25
            
            scored_comps.append({
                "competition": comp,
                "match_score": min(score, 100)
            })
        
        # Sort by score
        scored_comps.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Return top recommendations
        recommendations = scored_comps[:limit]
        
        return {
            "success": True,
            "data": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== ANALYTICS ENDPOINTS =====

@app.get("/api/analytics/user")
async def get_user_analytics(user_id: str = Query("default_user")):
    """Get user's competition analytics"""
    try:
        user_file = USERS_DIR / f"{user_id}.json"
        if not user_file.exists():
            return {"success": False, "message": "Profile not found"}
        
        with open(user_file, 'r') as f:
            profile_data = json.load(f)
        
        analytics = {
            "competitions_entered": len(profile_data.get('competitions_entered', [])),
            "competitions_won": len(profile_data.get('competitions_won', [])),
            "win_rate": 0,
            "skill_levels": profile_data.get('skill_levels', {}),
            "specializations": profile_data.get('specializations', []),
            "portfolio_value": len(profile_data.get('portfolio_items', [])) * 10  # Simplified
        }
        
        if analytics['competitions_entered'] > 0:
            analytics['win_rate'] = (analytics['competitions_won'] / analytics['competitions_entered']) * 100
        
        return {"success": True, "data": analytics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== REFRESH ENDPOINT =====

@app.post("/api/refresh")
async def refresh_competitions():
    """Manually trigger a refresh of all competitions"""
    try:
        results = {}
        for source, fetcher in FETCHERS.items():
            try:
                print(f"Refreshing {source}...")
                competitions = fetcher.run()
                cache.save_competitions(competitions, source)
                results[source] = {"success": True, "count": len(competitions)}
            except Exception as e:
                results[source] = {"success": False, "error": str(e)}
        
        return {"success": True, "results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== HEALTH CHECK =====

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "fetchers_count": len(FETCHERS),
        "fetchers": list(FETCHERS.keys())
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "CompeteHub API",
        "version": "2.0.0",
        "description": "Comprehensive API for discovering and tracking competitions",
        "endpoints": {
            "competitions": "/api/competitions",
            "competition_by_id": "/api/competitions/{id}",
            "upcoming_week": "/api/competitions/upcoming/week",
            "stats": "/api/stats/overview",
            "user_profile": "/api/users/profile",
            "recommendations": "/api/recommendations",
            "analytics": "/api/analytics/user",
            "refresh": "/api/refresh",
            "health": "/health"
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
