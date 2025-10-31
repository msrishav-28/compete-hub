import requests
from datetime import datetime
from typing import List, Dict, Any
from models.competition import Competition, CompetitionCategory, DifficultyLevel
from ..base_fetcher import BaseFetcher
import logging

logger = logging.getLogger(__name__)

class CodeforcesFetcher(BaseFetcher):
    """Fetches coding contests from Codeforces API"""
    
    def __init__(self):
        super().__init__("Codeforces")
        self.base_url = "https://codeforces.com/api"
        self.session = requests.Session()
    
    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch contests from Codeforces API"""
        try:
            response = self.session.get(f"{self.base_url}/contest.list", timeout=10)
            response.raise_for_status()
            return response.json().get('result', [])
        except Exception as e:
            logger.error(f"Error fetching from Codeforces: {e}")
            return []
    
    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        """Parse Codeforces contests into Competition objects"""
        competitions = []
        now = datetime.now()
        
        for contest in data:
            try:
                # Skip if not a programming contest
                if contest.get('type') != 'CF' or contest.get('phase') != 'BEFORE':
                    continue
                
                start_time = datetime.fromtimestamp(contest.get('startTimeSeconds', 0))
                
                # Skip past contests
                if start_time < now:
                    continue
                
                comp = Competition()
                comp.id = f"codeforces_{contest.get('id')}"
                comp.title = contest.get('name', 'Codeforces Contest')
                comp.description = f"Codeforces {contest.get('type')} Contest"
                comp.category = CompetitionCategory.CODING_CONTEST
                comp.platform = "Codeforces"
                
                # Set difficulty based on contest name
                if 'Div. 1' in comp.title:
                    comp.difficulty = DifficultyLevel.ADVANCED
                elif 'Div. 2' in comp.title:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                elif 'Div. 3' in comp.title or 'Div. 4' in comp.title:
                    comp.difficulty = DifficultyLevel.BEGINNER
                else:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                
                # Set dates and duration
                comp.start_date = start_time
                duration_seconds = contest.get('durationSeconds', 7200)  # Default 2 hours
                comp.duration_hours = duration_seconds / 3600
                comp.end_date = datetime.fromtimestamp(contest.get('startTimeSeconds', 0) + duration_seconds)
                
                # Set other properties
                comp.link = f"https://codeforces.com/contests/{contest.get('id')}"
                comp.registration_link = comp.link
                comp.team_size = "solo"
                comp.time_commitment = "medium" if comp.duration_hours <= 5 else "high"
                comp.skills_required = ["Algorithms", "Data Structures", "Problem Solving"]
                comp.tags = ["competitive programming", "algorithms"]
                comp.portfolio_value = 50
                comp.recruitment_potential = True
                comp.companies_recruiting = ["Top Tech Companies"]
                comp.source = "Codeforces API"
                
                competitions.append(comp)
                
            except Exception as e:
                logger.error(f"Error parsing Codeforces contest {contest.get('id')}: {e}")
                continue
        
        return competitions
