from abc import ABC, abstractmethod
from typing import List
from models.competition import Competition
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseFetcher(ABC):
    """Base class for all competition fetchers"""
    
    def __init__(self, source_name: str):
        self.source_name = source_name
    
    @abstractmethod
    def fetch(self) -> List[dict]:
        """Fetch competitions from source"""
        pass
    
    @abstractmethod
    def parse(self, data: any) -> List[Competition]:
        """Parse raw data into Competition objects"""
        pass
    
    def validate_competition(self, comp: Competition) -> bool:
        """Validate competition data"""
        required_fields = ['title', 'start_date', 'link']
        return all(hasattr(comp, field) and getattr(comp, field) for field in required_fields)
    
    def deduplicate(self, competitions: List[Competition]) -> List[Competition]:
        """Remove duplicate competitions"""
        seen = set()
        unique = []
        for comp in competitions:
            # Use title + start_date as unique key
            key = (comp.title, str(comp.start_date))
            if key not in seen:
                seen.add(key)
                unique.append(comp)
        return unique
    
    def run(self) -> List[Competition]:
        """Execute full fetch-parse-validate pipeline"""
        try:
            logger.info(f"Fetching from {self.source_name}...")
            data = self.fetch()
            competitions = self.parse(data)
            valid_competitions = [c for c in competitions if self.validate_competition(c)]
            unique_competitions = self.deduplicate(valid_competitions)
            logger.info(f"Successfully fetched {len(unique_competitions)} competitions from {self.source_name}")
            return unique_competitions
        except Exception as e:
            logger.error(f"Error fetching from {self.source_name}: {str(e)}")
            return []
