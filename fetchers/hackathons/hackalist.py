import logging
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from dateutil.parser import parse as parse_date
from dateutil import tz

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from models.competition import Competition, CompetitionCategory, DifficultyLevel
from fetchers.base_fetcher import BaseFetcher

logger = logging.getLogger(__name__)

class HackalistFetcher(BaseFetcher):
    """Fetches hackathons from Hackalist API."""
    
    def __init__(self):
        super().__init__("Hackalist")
        self.base_url = "https://www.hackalist.org/api/1.0"
        self.current_year = datetime.now().year
        
    def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch hackathons from Hackalist API for the current year.
        
        Returns:
            List of raw hackathon data dictionaries
        """
        hackathons = []
        try:
            # Hackalist API doesn't have a direct endpoint, we'll use their website's data
            # This is a workaround since Hackalist doesn't have a public API
            # We'll implement web scraping in the parse method
            # For now, return an empty list and handle everything in parse
            return []
        except Exception as e:
            logger.error(f"Error fetching from Hackalist: {e}")
            return []
    
    def parse(self, data: List[Dict[str, Any]]) -> List[Competition]:
        """
        Parse raw hackathon data into Competition objects.
        
        Args:
            data: Raw hackathon data (unused in this implementation)
            
        Returns:
            List of Competition objects
        """
        try:
            # Since Hackalist doesn't have a public API, we'll use web scraping
            # to get the hackathon data
            url = f"https://www.hackalist.org/"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            import re
            
            soup = BeautifulSoup(response.text, 'html.parser')
            hackathons = []
            
            # Find all hackathon cards
            hackathon_cards = soup.select('.hackathon-tile')
            
            for card in hackathon_cards:
                try:
                    # Extract hackathon details
                    title_elem = card.select_one('.hackathon-title')
                    if not title_elem:
                        continue
                        
                    title = title_elem.get_text(strip=True)
                    
                    # Get URL
                    url = card.get('href', '')
                    if url and not url.startswith('http'):
                        url = f"https://www.hackalist.org{url}"
                    
                    # Get date
                    date_str = ''
                    date_elem = card.select_one('.hackathon-date')
                    if date_elem:
                        date_str = date_elem.get_text(strip=True)
                    
                    # Parse date range (e.g., "Jan 5 - 7, 2024")
                    start_date = None
                    end_date = None
                    if date_str:
                        try:
                            # Extract year if present, otherwise use current year
                            year_match = re.search(r'(\d{4})', date_str)
                            year = int(year_match.group(1)) if year_match else self.current_year
                            
                            # Parse the date range
                            date_parts = re.split(r'\s*-\s*|\s*,\s*', date_str.strip())
                            if len(date_parts) >= 3:  # Has both start and end dates
                                start_month_day = date_parts[0].split()
                                if len(start_month_day) == 2:
                                    start_month = start_month_day[0][:3]  # First 3 letters of month
                                    start_day = start_month_day[1]
                                    start_date_str = f"{start_month} {start_day} {year}"
                                    start_date = parse_date(start_date_str)
                                    
                                    end_month_day = date_parts[1].split()
                                    if len(end_month_day) == 2:  # Month and day
                                        end_month = end_month_day[0][:3]
                                        end_day = end_month_day[1]
                                    else:  # Just day, same month as start
                                        end_month = start_month
                                        end_day = end_month_day[0]
                                    
                                    end_date_str = f"{end_month} {end_day} {year}"
                                    end_date = parse_date(end_date_str)
                        except Exception as e:
                            logger.warning(f"Error parsing date '{date_str}': {e}")
                    
                    # Get location
                    location = ''
                    location_elem = card.select_one('.hackathon-location')
                    if location_elem:
                        location = location_elem.get_text(strip=True)
                    
                    # Get description
                    description = ''
                    desc_elem = card.select_one('.hackathon-description')
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)
                    
                    # Get prize info if available
                    prize = ''
                    prize_elem = card.select_one('.hackathon-prize')
                    if prize_elem:
                        prize = prize_elem.get_text(strip=True)
                    
                    # Create competition object
                    competition = Competition()
                    competition.id = f"hackalist_{title.lower().replace(' ', '_')}_{year}"
                    competition.title = title
                    competition.link = url
                    competition.start_date = start_date
                    competition.end_date = end_date
                    competition.category = CompetitionCategory.HACKATHON
                    competition.difficulty = DifficultyLevel.INTERMEDIATE
                    competition.location = location
                    competition.description = description if description else f"Hackathon: {title}"
                    competition.source = "Hackalist Web Scraping"
                    competition.platform = "Hackalist"
                    competition.team_size = "team"
                    competition.time_commitment = "high"
                    competition.skills_required = ["Software Development", "Problem Solving", "Teamwork"]
                    competition.tags = ["hackathon", "innovation"]
                    competition.portfolio_value = 70
                    competition.recruitment_potential = True
                    
                    # Parse prize if available
                    if prize and any(c.isdigit() for c in prize):
                        prize_value = int(''.join(filter(str.isdigit, prize)) or '0')
                        if prize_value > 0:
                            competition.prize = {
                                "type": "cash",
                                "value": prize_value,
                                "currency": "USD"
                            }
                    
                    hackathons.append(competition)
                    
                except Exception as e:
                    logger.error(f"Error parsing hackathon: {e}", exc_info=True)
            
            return hackathons
            
        except Exception as e:
            logger.error(f"Error parsing Hackalist data: {e}", exc_info=True)
            return []
    
    def validate_competition(self, competition: Competition) -> bool:
        """
        Validate a competition object.
        
        Args:
            competition: Competition object to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Basic validation
        if not competition.title or not competition.link:
            return False
            
        # Check if the hackathon is in the future
        if competition.end_date and competition.end_date < datetime.now():
            return False
            
        return True
    
    def deduplicate(self, competitions: List[Competition]) -> List[Competition]:
        """
        Deduplicate competitions by link and title.
        
        Args:
            competitions: List of Competition objects
            
        Returns:
            Deduplicated list of Competition objects
        """
        seen = set()
        deduped = []
        
        for comp in competitions:
            # Create a unique key based on title and link
            key = (comp.title.lower(), comp.link.lower() if comp.link else "")
            if key not in seen:
                seen.add(key)
                deduped.append(comp)
                
        return deduped
