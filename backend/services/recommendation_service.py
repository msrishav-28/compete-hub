"""
Recommendation service - AI/ML-powered competition recommendations.
Matches users to competitions based on profile, skills, and preferences.
"""
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

from backend.repositories.user_repository import UserRepository
from backend.repositories.competition_repository import CompetitionRepository
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating personalized competition recommendations."""
    
    # Weights for scoring (can be tuned or made configurable)
    WEIGHT_CATEGORY = 30
    WEIGHT_DIFFICULTY = 25
    WEIGHT_SKILLS = 25
    WEIGHT_TIME = 10
    WEIGHT_RECRUITMENT = 10
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.user_repo = UserRepository(db)
        self.competition_repo = CompetitionRepository(db)
    
    async def get_recommendations(
        self, 
        user_id: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Generate personalized competition recommendations.
        Uses a scoring algorithm based on user preferences and skills.
        """
        # Get user profile
        user = await self.user_repo.get_by_user_id(user_id)
        
        if not user:
            # Return popular competitions for new users
            return await self._get_default_recommendations(limit)
        
        # Get all available competitions
        all_competitions = await self.competition_repo.get_all(limit=500)
        
        if not all_competitions:
            return {
                "success": True,
                "data": [],
                "message": "No competitions available"
            }
        
        # Score and rank competitions
        scored_competitions = []
        for comp in all_competitions:
            score, reasons = self._calculate_score(comp, user)
            if score > 0:
                scored_competitions.append({
                    "competition": comp,
                    "score": score,
                    "reasons": reasons
                })
        
        # Sort by score descending
        scored_competitions.sort(key=lambda x: x["score"], reverse=True)
        
        # Take top N
        top_recommendations = scored_competitions[:limit]
        
        return {
            "success": True,
            "data": top_recommendations,
            "count": len(top_recommendations),
            "user_preferences": {
                "categories": user.get("preferred_categories", []),
                "difficulty": user.get("difficulty_preference"),
                "skills": list(user.get("skill_levels", {}).keys())
            }
        }
    
    def _calculate_score(
        self, 
        competition: Dict[str, Any], 
        user: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Calculate recommendation score for a competition.
        Returns (score, reasons) tuple.
        """
        score = 0.0
        reasons = []
        
        # Skip past competitions
        start_date_str = competition.get("start_date")
        if start_date_str:
            try:
                if isinstance(start_date_str, str):
                    start_date = datetime.fromisoformat(
                        start_date_str.replace("Z", "+00:00")
                    )
                else:
                    start_date = start_date_str
                
                if start_date < datetime.now(start_date.tzinfo if hasattr(start_date, 'tzinfo') and start_date.tzinfo else None):
                    return 0, []
            except (ValueError, TypeError):
                pass
        
        # Skip already saved competitions
        saved_comps = user.get("saved_competitions", [])
        if competition.get("id") in saved_comps:
            return 0, []
        
        # 1. Category match
        user_categories = user.get("preferred_categories", [])
        comp_category = competition.get("category", "")
        if comp_category in user_categories:
            score += self.WEIGHT_CATEGORY
            reasons.append(f"Matches your interest in {comp_category}")
        elif user_categories:
            # Partial match for related categories
            score += self.WEIGHT_CATEGORY * 0.3
        else:
            # No preferences set, give base score
            score += self.WEIGHT_CATEGORY * 0.5
        
        # 2. Difficulty match
        user_difficulty = user.get("difficulty_preference", "intermediate")
        comp_difficulty = competition.get("difficulty", "intermediate")
        
        difficulty_order = ["beginner", "intermediate", "advanced", "expert"]
        
        try:
            user_idx = difficulty_order.index(user_difficulty)
            comp_idx = difficulty_order.index(comp_difficulty)
            
            diff_gap = abs(user_idx - comp_idx)
            
            if diff_gap == 0:
                score += self.WEIGHT_DIFFICULTY
                reasons.append(f"Perfect difficulty match ({comp_difficulty})")
            elif diff_gap == 1:
                score += self.WEIGHT_DIFFICULTY * 0.7
                reasons.append(f"Close to your level ({comp_difficulty})")
            else:
                score += self.WEIGHT_DIFFICULTY * 0.3
        except ValueError:
            score += self.WEIGHT_DIFFICULTY * 0.5
        
        # 3. Skills match
        user_skills = set(user.get("skill_levels", {}).keys())
        comp_skills = set(competition.get("skills_required", []))
        
        if user_skills and comp_skills:
            overlap = user_skills.intersection(comp_skills)
            if overlap:
                match_ratio = len(overlap) / len(comp_skills)
                score += self.WEIGHT_SKILLS * match_ratio
                reasons.append(f"Matches your skills: {', '.join(list(overlap)[:3])}")
            else:
                # Learning opportunity
                score += self.WEIGHT_SKILLS * 0.2
        else:
            score += self.WEIGHT_SKILLS * 0.5
        
        # 4. Time commitment match
        user_time = user.get("time_available_weekly", 10)
        comp_commitment = competition.get("time_commitment", "medium")
        
        commitment_hours = {
            "low": 5,
            "medium": 15,
            "high": 30
        }
        
        estimated_hours = commitment_hours.get(comp_commitment, 15)
        
        if user_time >= estimated_hours:
            score += self.WEIGHT_TIME
            reasons.append("Fits your schedule")
        elif user_time >= estimated_hours * 0.7:
            score += self.WEIGHT_TIME * 0.6
        
        # 5. Recruitment potential
        if competition.get("recruitment_potential"):
            # Check if user is interested in recruitment
            user_goals = user.get("goals", [])
            recruitment_keywords = ["job", "career", "internship", "hiring", "recruitment"]
            
            if any(kw in goal.lower() for goal in user_goals for kw in recruitment_keywords):
                score += self.WEIGHT_RECRUITMENT
                reasons.append("Has recruitment opportunities")
            else:
                score += self.WEIGHT_RECRUITMENT * 0.5
        
        # Normalize score to 0-100
        max_possible = (
            self.WEIGHT_CATEGORY + 
            self.WEIGHT_DIFFICULTY + 
            self.WEIGHT_SKILLS + 
            self.WEIGHT_TIME + 
            self.WEIGHT_RECRUITMENT
        )
        
        normalized_score = (score / max_possible) * 100
        
        return round(normalized_score, 2), reasons
    
    async def _get_default_recommendations(
        self, 
        limit: int
    ) -> Dict[str, Any]:
        """Get default recommendations for users without profiles."""
        # Get upcoming competitions
        upcoming = await self.competition_repo.get_upcoming(days=30, limit=limit)
        
        recommendations = [
            {
                "competition": comp,
                "score": 50.0,
                "reasons": ["Popular upcoming competition"]
            }
            for comp in upcoming
        ]
        
        return {
            "success": True,
            "data": recommendations,
            "count": len(recommendations),
            "message": "Default recommendations - complete your profile for personalized suggestions"
        }
    
    async def get_similar_competitions(
        self, 
        competition_id: str,
        limit: int = 5
    ) -> Dict[str, Any]:
        """Find competitions similar to a given one."""
        # Get the reference competition
        reference = await self.competition_repo.get_by_id(competition_id)
        
        if not reference:
            return {
                "success": False,
                "error": "Competition not found"
            }
        
        # Get all competitions
        all_competitions = await self.competition_repo.get_all(limit=200)
        
        similar = []
        for comp in all_competitions:
            if comp.get("id") == competition_id:
                continue
            
            similarity = self._calculate_similarity(reference, comp)
            if similarity > 0.3:  # Threshold
                similar.append({
                    "competition": comp,
                    "similarity": similarity
                })
        
        # Sort by similarity
        similar.sort(key=lambda x: x["similarity"], reverse=True)
        
        return {
            "success": True,
            "data": similar[:limit],
            "reference": reference.get("title")
        }
    
    def _calculate_similarity(
        self, 
        comp1: Dict[str, Any], 
        comp2: Dict[str, Any]
    ) -> float:
        """Calculate similarity between two competitions."""
        score = 0.0
        
        # Same category
        if comp1.get("category") == comp2.get("category"):
            score += 0.4
        
        # Same difficulty
        if comp1.get("difficulty") == comp2.get("difficulty"):
            score += 0.2
        
        # Same platform
        if comp1.get("platform") == comp2.get("platform"):
            score += 0.15
        
        # Overlapping skills
        skills1 = set(comp1.get("skills_required", []))
        skills2 = set(comp2.get("skills_required", []))
        
        if skills1 and skills2:
            overlap = len(skills1.intersection(skills2))
            total = len(skills1.union(skills2))
            if total > 0:
                score += 0.25 * (overlap / total)
        
        return score
