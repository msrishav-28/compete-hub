"""
CompeteHub API.

Routes only — all business logic lives in backend.services.
Database is Supabase Postgres (asyncpg pool).
"""
import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import asyncpg
from fastapi import Body, Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Make project-root imports work for fetchers/models when run directly.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings
from backend.core.dependencies import (
    get_current_user_id,
    get_db_pool,
    require_admin,
)
from backend.database import close_db, connect_to_db, get_pool, is_connected, ping
from backend.schemas.requests import (
    CompetitionEnterRequest,
    CompetitionSaveRequest,
    CompetitionWinRequest,
    UserProfileUpdate,
)
from backend.services.competition_service import CompetitionService
from backend.services.fetcher_service import FetcherService
from backend.services.recommendation_service import RecommendationService
from backend.services.user_service import UserService

from fetchers.coding_contests.clist import ClistFetcher
from fetchers.coding_contests.codeforces import CodeforcesFetcher
from fetchers.data_science.kaggle import KaggleFetcher
from fetchers.hackathons.devpost import DevpostFetcher
from fetchers.hackathons.mlh import MLHFetcher
from fetchers.hackathons.unstop import UnstopFetcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

FETCHERS: dict = {
    "codeforces": CodeforcesFetcher(),
    "clist":      ClistFetcher(),
    "kaggle":     KaggleFetcher(),
    "devpost":    DevpostFetcher(),
    "unstop":     UnstopFetcher(),
    "mlh":        MLHFetcher(),
}


# ---------- service factories ----------
def comp_svc(pool: asyncpg.Pool = Depends(get_db_pool)) -> CompetitionService:
    return CompetitionService(pool)


def user_svc(pool: asyncpg.Pool = Depends(get_db_pool)) -> UserService:
    return UserService(pool)


def reco_svc(pool: asyncpg.Pool = Depends(get_db_pool)) -> RecommendationService:
    return RecommendationService(pool)


def fetcher_svc(pool: asyncpg.Pool = Depends(get_db_pool)) -> FetcherService:
    return FetcherService(pool, FETCHERS)


async def _initial_fetch_if_empty() -> None:
    """
    If the competitions table is empty, kick off a background scrape.
    Runs once per process, never blocks the readiness check.
    The fetcher's per-source advisory lock makes this safe across workers.
    """
    pool = get_pool()
    if pool is None:
        return
    try:
        async with pool.acquire() as conn:
            count = await conn.fetchval("SELECT COUNT(*) FROM competitions")
        if (count or 0) > 0:
            return
        logger.info("Competitions table is empty; starting initial background fetch.")
        f_svc = FetcherService(pool, FETCHERS)
        await f_svc.fetch_all_sources(force=False)
    except Exception:
        logger.exception("Initial fetch failed (non-fatal).")


# ---------- lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Open the DB pool on startup. Scraping is deferred to a background
    task so the health check is reachable immediately — Render's
    free-tier cold-start tolerance is short.
    """
    try:
        await connect_to_db()
    except Exception:
        logger.exception("Failed to open DB pool at startup; running degraded.")

    fetch_task: Optional[asyncio.Task] = None
    if is_connected():
        fetch_task = asyncio.create_task(_initial_fetch_if_empty())

    yield

    if fetch_task and not fetch_task.done():
        fetch_task.cancel()
    await close_db()


# ---------- app ----------
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    detail = str(exc) if settings.is_development else "An unexpected error occurred"
    return JSONResponse(status_code=500, content={"success": False, "error": detail})


# ---------- competition endpoints ----------
@app.get("/api/competitions")
async def get_competitions(
    category: Optional[str] = Query(None, max_length=100),
    difficulty: Optional[str] = Query(None, max_length=20),
    time_commitment: Optional[str] = Query(None, max_length=20),
    search: Optional[str] = Query(None, max_length=200),
    platform: Optional[str] = Query(None, max_length=50),
    recruitment_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: CompetitionService = Depends(comp_svc),
):
    return await service.get_competitions(
        category=category,
        difficulty=difficulty,
        time_commitment=time_commitment,
        platform=platform,
        recruitment_only=recruitment_only,
        search=search,
        limit=limit,
        offset=offset,
    )


@app.get("/api/competitions/upcoming/week")
async def get_upcoming_week(service: CompetitionService = Depends(comp_svc)):
    return await service.get_upcoming_week()


@app.get("/api/competitions/{competition_id}")
async def get_competition_by_id(
    competition_id: str,
    service: CompetitionService = Depends(comp_svc),
):
    comp = await service.get_competition_by_id(competition_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    return {"success": True, "data": comp}


@app.get("/api/stats/overview")
async def get_stats_overview(service: CompetitionService = Depends(comp_svc)):
    return await service.get_stats_overview()


# ---------- user endpoints ----------
@app.get("/api/users/profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    return await service.get_user_profile(user_id)


@app.post("/api/users/profile")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def update_profile(
    request: Request,
    profile_update: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    updates = profile_update.model_dump(exclude_unset=True)
    return await service.update_user_profile(user_id, updates)


@app.post("/api/users/competition/save")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def save_competition(
    request: Request,
    body: CompetitionSaveRequest,
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    return await service.save_competition(user_id, body.comp_id, body.save)


@app.post("/api/users/competition/enter")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def enter_competition(
    request: Request,
    body: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    """
    Accept both shapes:
      - The current frontend posts `JSON.stringify(compId)` -> a bare string body
      - Well-behaved clients post `{"comp_id": "..."}`
    Either way, we resolve to a single string and route through the service.
    """
    comp_id: Optional[str] = None
    if isinstance(body, str):
        comp_id = body.strip()
    elif isinstance(body, dict):
        raw = body.get("comp_id") or body.get("competition_id")
        if isinstance(raw, str):
            comp_id = raw.strip()
    if not comp_id:
        raise HTTPException(status_code=422, detail="comp_id is required")
    return await service.enter_competition(user_id, comp_id)


@app.post("/api/users/competition/win")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def record_win(
    request: Request,
    body: CompetitionWinRequest,
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    return await service.record_win(user_id, body.comp_id, body.placement)


# ---------- recommendations / analytics ----------
@app.get("/api/recommendations")
async def get_recommendations(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(10, ge=1, le=50),
    service: RecommendationService = Depends(reco_svc),
):
    return await service.get_recommendations(user_id, limit)


@app.get("/api/analytics/user")
async def get_user_analytics(
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(user_svc),
):
    return await service.get_user_analytics(user_id)


# ---------- refresh (admin-gated) ----------
@app.post("/api/refresh")
@limiter.limit(f"{settings.rate_limit_refresh_per_hour}/hour")
async def refresh_competitions(
    request: Request,
    _: None = Depends(require_admin),
    service: FetcherService = Depends(fetcher_svc),
):
    result = await service.fetch_all_sources(force=True)
    result["timestamp"] = datetime.now(timezone.utc).isoformat()
    return result


@app.get("/api/refresh/status")
async def refresh_status(
    _: None = Depends(require_admin),
    service: FetcherService = Depends(fetcher_svc),
):
    return await service.get_source_status()


# ---------- health & root ----------
@app.get("/health")
async def health_check():
    db_ok = await ping() if is_connected() else False
    payload = {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.api_version,
        "environment": settings.environment,
        "database": {"connected": db_ok},
        "fetchers": {"count": len(FETCHERS), "sources": list(FETCHERS.keys())},
    }
    # Return 503 when degraded so the load balancer routes traffic away.
    status_code = 200 if db_ok else 503
    return JSONResponse(status_code=status_code, content=payload)


@app.get("/")
async def root():
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "documentation": "/docs",
        "health": "/health",
    }


# ---------- run ----------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=settings.is_development)
