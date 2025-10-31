from typing import List, Optional, Dict, Any
from datetime import datetime
from models.competition import Competition, CompetitionCategory, DifficultyLevel

class CompetitionFilter:
    """Class to filter competitions based on various criteria"""
    
    @staticmethod
    def filter_by_category(competitions: List[Dict], categories: List[str]) -> List[Dict]:
        """Filter competitions by category"""
        if not categories:
            return competitions
        return [c for c in competitions if c.get('category') in categories]
    
    @staticmethod
    def filter_by_difficulty(competitions: List[Dict], difficulties: List[str]) -> List[Dict]:
        """Filter competitions by difficulty level"""
        if not difficulties:
            return competitions
        return [c for c in competitions if c.get('difficulty') in difficulties]
    
    @staticmethod
    def filter_by_date_range(competitions: List[Dict], 
                           start_date: Optional[datetime] = None, 
                           end_date: Optional[datetime] = None) -> List[Dict]:
        """Filter competitions by date range"""
        filtered = competitions
        
        if start_date:
            filtered = [c for c in filtered 
                       if datetime.fromisoformat(c['start_date']) >= start_date 
                       if 'start_date' in c and c['start_date']]
        
        if end_date:
            filtered = [c for c in filtered 
                       if datetime.fromisoformat(c['start_date']) <= end_date 
                       if 'start_date' in c and c['start_date']]
        
        return filtered
    
    @staticmethod
    def filter_by_skills(competitions: List[Dict], skills: List[str]) -> List[Dict]:
        """Filter competitions by required skills"""
        if not skills:
            return competitions
        
        filtered = []
        for comp in competitions:
            comp_skills = comp.get('skills_required', [])
            if any(skill.lower() in [s.lower() for s in comp_skills] for skill in skills):
                filtered.append(comp)
        return filtered
    
    @staticmethod
    def filter_by_company(competitions: List[Dict], companies: List[str]) -> List[Dict]:
        """Filter competitions by company"""
        if not companies:
            return competitions
            
        filtered = []
        for comp in competitions:
            if (comp.get('company') in companies or 
                any(company in comp.get('companies_recruiting', []) for company in companies)):
                filtered.append(comp)
        return filtered
    
    @staticmethod
    def filter_by_commitment(competitions: List[Dict], commitment: str) -> List[Dict]:
        """Filter by time commitment (low/medium/high)"""
        if not commitment:
            return competitions
        return [c for c in competitions if c.get('time_commitment') == commitment]
    
    @staticmethod
    def filter_recruitment(competitions: List[Dict], recruitment_only: bool = False) -> List[Dict]:
        """Filter for competitions with recruitment potential"""
        if not recruitment_only:
            return competitions
        return [c for c in competitions if c.get('recruitment_potential', False)]
    
    @staticmethod
    def sort_competitions(competitions: List[Dict], 
                         sort_by: str = 'date', 
                         ascending: bool = False) -> List[Dict]:
        """Sort competitions by various criteria"""
        if not competitions:
            return []
            
        key_func = None
        
        if sort_by == 'date':
            key_func = lambda x: (
                datetime.fromisoformat(x['start_date']) if x.get('start_date') else datetime.max
            )
        elif sort_by == 'prize':
            key_func = lambda x: (
                float(x.get('prize', {}).get('value', 0)) 
                if x.get('prize', {}).get('value') and str(x['prize']['value']).isdigit() 
                else 0
            )
        elif sort_by == 'portfolio_value':
            key_func = lambda x: x.get('portfolio_value', 0)
        elif sort_by == 'difficulty':
            difficulty_rank = {
                'beginner': 0,
                'intermediate': 1,
                'advanced': 2,
                'expert': 3,
                'mixed': 1.5
            }
            key_func = lambda x: difficulty_rank.get(x.get('difficulty', '').lower(), 0)
        
        if key_func:
            return sorted(competitions, key=key_func, reverse=not ascending)
        return competitions
