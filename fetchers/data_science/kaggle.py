import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models.competition import Competition, CompetitionCategory, DifficultyLevel
from ..base_fetcher import BaseFetcher
import logging

logger = logging.getLogger(__name__)

class KaggleFetcher(BaseFetcher):
    """Fetches data science competitions from Kaggle API"""
    
    def __init__(self):
        super().__init__("Kaggle")
        self.base_url = "https://www.kaggle.com/api/v1/competitions"
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch competitions from Kaggle API"""
        try:
            # Kaggle's API doesn't require authentication for public data
            response = self.session.get(
                f"{self.base_url}/list",
                params={"sortBy": "latestDeadline"},
                timeout=15
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching from Kaggle: {e}")
            return []
    
    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        """Parse Kaggle competitions into Competition objects"""
        competitions = []
        now = datetime.utcnow()
        
        for comp_data in data:
            try:
                # Skip if not active or upcoming
                if comp_data.get('status') not in ['active', 'completed']:
                    continue
                
                # Parse dates
                deadline_str = comp_data.get('deadline')
                enabled_date_str = comp_data.get('enabledDate')
                
                if not deadline_str or not enabled_date_str:
                    continue
                    
                try:
                    end_date = datetime.strptime(deadline_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    start_date = datetime.strptime(enabled_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    
                    # Skip if competition has already ended
                    if end_date < now:
                        continue
                except (ValueError, TypeError):
                    continue
                
                # Create competition object
                comp = Competition()
                comp.id = f"kaggle_{comp_data.get('id')}"
                comp.title = comp_data.get('title', 'Kaggle Competition')
                comp.description = comp_data.get('description', '')
                comp.category = CompetitionCategory.KAGGLE
                comp.platform = "Kaggle"
                comp.company = comp_data.get('organizationName', 'Kaggle')
                
                # Set difficulty based on reward
                reward = comp_data.get('reward', 0)
                if reward >= 10000:
                    comp.difficulty = DifficultyLevel.EXPERT
                elif reward >= 5000:
                    comp.difficulty = DifficultyLevel.ADVANCED
                elif reward >= 1000:
                    comp.difficulty = DifficultyLevel.INTERMEDIATE
                else:
                    comp.difficulty = DifficultyLevel.BEGINNER
                
                # Set dates and duration
                comp.start_date = start_date
                comp.end_date = end_date
                comp.duration_hours = (end_date - start_date).total_seconds() / 3600
                comp.registration_deadline = end_date - timedelta(days=7)  # Approximate
                
                # Set other properties
                comp.link = f"https://kaggle.com/c/{comp_data.get('url', '')}"
                comp.team_size = "team" if comp_data.get('teamCount', 1) > 1 else "solo"
                comp.time_commitment = "high"  # Most Kaggle competitions are long-term
                comp.skills_required = ["Data Science", "Machine Learning", "Python", "Data Analysis"]
                
                # Add tags based on competition title
                tags = ["data science", "machine learning", "kaggle"]
                title_lower = comp.title.lower()
                if any(x in title_lower for x in ['nlp', 'natural language']):
                    tags.extend(['nlp', 'text processing'])
                if any(x in title_lower for x in ['cv', 'computer vision', 'image']):
                    tags.extend(['computer vision', 'image processing'])
                if any(x in title_lower for x in ['tabular', 'structured']):
                    tags.append('tabular data')
                
                comp.tags = list(set(tags))  # Remove duplicates
                comp.portfolio_value = 80  # Kaggle competitions are highly valued
                comp.recruitment_potential = True
                comp.companies_recruiting = ["Top Tech Companies"]
                comp.source = "Kaggle API"
                
                # Add prize information
                if reward > 0:
                    comp.prize = {
                        "type": "cash",
                        "value": reward,
                        "currency": "USD"
                    }
                
                competitions.append(comp)
                
            except Exception as e:
                logger.error(f"Error parsing Kaggle competition {comp_data.get('id')}: {e}")
                continue
        
        return competitions
