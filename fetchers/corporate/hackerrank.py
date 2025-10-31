import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from models.competition import Competition, CompetitionCategory, DifficultyLevel
from ..base_fetcher import BaseFetcher
import logging
import re

logger = logging.getLogger(__name__)

class HackerRankFetcher(BaseFetcher):
    """Fetches competitions and challenges from HackerRank"""
    
    def __init__(self):
        super().__init__("HackerRank")
        self.base_url = "https://www.hackerrank.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
    
    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch competitions from HackerRank"""
        try:
            # Scrape the contests page
            response = self.session.get(
                f"{self.base_url}/contests",
                timeout=15
            )
            response.raise_for_status()
            
            # Also fetch hackathons
            hackathon_response = self.session.get(
                f"{self.base_url}/contests?filters%5Bstatus%5D%5B%5D=active&filters%5Bstatus%5D%5B%5D=upcoming&filters%5Btype%5D%5B%5D=all&filters%5Btype%5D%5B%5D=college&filters%5Btype%5D%5B%5D=open&filters%5Btype%5D%5B%5D=private&filters%5Btype%5D%5B%5D=invitational&filters%5Btype%5D%5B%5D=public&filters%5Btype%5D%5B%5D=recruitment&filters%5Btype%5D%5B%5D=competitions&filters%5Btype%5D%5B%5D=workshops&filters%5Btype%5D%5B%5D=conferences&filters%5Btype%5D%5B%5D=hackathons",
                timeout=15
            )
            
            return [response.text, hackathon_response.text if hackathon_response.ok else ""]
            
        except Exception as e:
            logger.error(f"Error fetching from HackerRank: {e}")
            return [""]
    
    def parse(self, data: List[str]) -> List[Competition]:
        """Parse HackerRank contests into Competition objects"""
        competitions = []
        
        if not data or not any(data):
            return competitions
            
        contests_html = data[0]
        hackathons_html = data[1] if len(data) > 1 else ""
        
        # Parse regular contests
        if contests_html:
            try:
                soup = BeautifulSoup(contests_html, 'html.parser')
                contest_cards = soup.select('.contest-card')
                
                for card in contest_cards:
                    try:
                        comp = self._parse_contest_card(card)
                        if comp:
                            competitions.append(comp)
                    except Exception as e:
                        logger.error(f"Error parsing HackerRank contest card: {e}")
                        continue
            except Exception as e:
                logger.error(f"Error parsing HackerRank contests: {e}")
        
        # Parse hackathons
        if hackathons_html:
            try:
                soup = BeautifulSoup(hackathons_html, 'html.parser')
                hackathon_cards = soup.select('.hackathon-card')
                
                for card in hackathon_cards:
                    try:
                        comp = self._parse_hackathon_card(card)
                        if comp:
                            competitions.append(comp)
                    except Exception as e:
                        logger.error(f"Error parsing HackerRank hackathon card: {e}")
                        continue
            except Exception as e:
                logger.error(f"Error parsing HackerRank hackathons: {e}")
        
        return competitions
    
    def _parse_contest_card(self, card) -> Optional[Competition]:
        """Parse a single contest card"""
        try:
            title_elem = card.select_one('.contest-name')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            link = self.base_url + title_elem['href'] if title_elem.get('href') else ""
            
            # Extract metadata
            meta = {}
            meta_elems = card.select('.contest-meta')
            for elem in meta_elems:
                text = elem.get_text(strip=True)
                if 'starts' in text.lower():
                    meta['start'] = text
                elif 'ends' in text.lower():
                    meta['end'] = text
            
            # Parse dates
            now = datetime.utcnow()
            start_date = self._parse_date(meta.get('start', ''), now)
            end_date = self._parse_date(meta.get('end', ''), now + timedelta(days=7))
            
            # Create competition object
            comp = Competition()
            comp.id = f"hackerrank_{hash(title)}"
            comp.title = title
            comp.description = f"HackerRank {'Contest'}"
            comp.category = CompetitionCategory.CODING_CONTEST
            comp.platform = "HackerRank"
            comp.difficulty = DifficultyLevel.INTERMEDIATE
            
            # Set dates
            comp.start_date = start_date
            comp.end_date = end_date
            if start_date and end_date:
                comp.duration_hours = (end_date - start_date).total_seconds() / 3600
            
            # Set other properties
            comp.link = link
            comp.team_size = "solo"  # Most HackerRank contests are individual
            comp.time_commitment = "medium"
            comp.skills_required = ["Algorithms", "Data Structures", "Problem Solving"]
            comp.tags = ["coding challenge", "algorithms", "data structures"]
            comp.portfolio_value = 40
            comp.recruitment_potential = True
            comp.companies_recruiting = ["Top Tech Companies"]
            comp.source = "HackerRank Web Scraping"
            
            return comp
            
        except Exception as e:
            logger.error(f"Error in _parse_contest_card: {e}")
            return None
    
    def _parse_hackathon_card(self, card) -> Optional[Competition]:
        """Parse a single hackathon card"""
        try:
            title_elem = card.select_one('.hackathon-name')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            link = self.base_url + title_elem['href'] if title_elem.get('href') else ""
            
            # Parse dates
            date_elem = card.select_one('.hackathon-date')
            start_date, end_date = self._parse_hackathon_dates(date_elem.get_text() if date_elem else "")
            
            # Create competition object
            comp = Competition()
            comp.id = f"hackerrank_hack_{hash(title)}"
            comp.title = title
            comp.description = f"HackerRank Hackathon: {title}"
            comp.category = CompetitionCategory.HACKATHON
            comp.platform = "HackerRank"
            comp.difficulty = DifficultyLevel.INTERMEDIATE
            
            # Set dates
            comp.start_date = start_date
            comp.end_date = end_date
            if start_date and end_date:
                comp.duration_hours = (end_date - start_date).total_seconds() / 3600
            
            # Set other properties
            comp.link = link
            comp.team_size = "team"
            comp.time_commitment = "high"
            comp.skills_required = ["Software Development", "Problem Solving", "Teamwork"]
            comp.tags = ["hackathon", "software development", "team competition"]
            comp.portfolio_value = 70
            comp.recruitment_potential = True
            comp.companies_recruiting = ["Top Tech Companies"]
            comp.source = "HackerRank Web Scraping"
            
            # Try to extract prize info
            prize_elem = card.select_one('.prize-amount')
            if prize_elem:
                prize_text = prize_elem.get_text(strip=True)
                if prize_text and any(c.isdigit() for c in prize_text):
                    prize_value = int(''.join(filter(str.isdigit, prize_text)) or '0')
                    if prize_value > 0:
                        comp.prize = {
                            "type": "cash",
                            "value": prize_value,
                            "currency": "USD"
                        }
            
            return comp
            
        except Exception as e:
            logger.error(f"Error in _parse_hackathon_card: {e}")
            return None
    
    def _parse_date(self, date_str: str, default: datetime) -> datetime:
        """Parse date string from HackerRank"""
        if not date_str:
            return default
            
        try:
            # Try to extract date from string like "Starts in 2 days"
            if 'starts' in date_str.lower() or 'starts' in date_str.lower():
                if 'today' in date_str.lower():
                    return datetime.utcnow()
                elif 'tomorrow' in date_str.lower():
                    return datetime.utcnow() + timedelta(days=1)
                elif 'in' in date_str.lower():
                    # Extract number of days
                    match = re.search(r'(\d+)\s+day', date_str.lower())
                    if match:
                        days = int(match.group(1))
                        return datetime.utcnow() + timedelta(days=days)
            
            # Try to parse actual date string
            for fmt in ['%b %d, %Y', '%B %d, %Y', '%Y-%m-%d']:
                try:
                    return datetime.strptime(date_str.strip(), fmt)
                except ValueError:
                    continue
                    
            return default
        except Exception:
            return default
    
    def _parse_hackathon_dates(self, date_str: str) -> tuple:
        """Parse hackathon date range string"""
        now = datetime.utcnow()
        default_end = now + timedelta(days=30)
        
        if not date_str:
            return now, default_end
            
        try:
            # Try to extract date range like "Oct 15 - Nov 15, 2023"
            parts = date_str.split('-')
            if len(parts) == 2:
                start_str = parts[0].strip()
                end_str = parts[1].strip()
                
                # Get year from end date or use current year
                year_match = re.search(r'[0-9]{4}', end_str)
                year = int(year_match.group(0)) if year_match else now.year
                
                # Parse start date (assume same year as end date)
                start_date = self._parse_date_with_year(start_str, year)
                end_date = self._parse_date_with_year(end_str, year)
                
                # If end date is before start date, assume it's next year
                if end_date < start_date:
                    end_date = self._parse_date_with_year(end_str, year + 1)
                
                return start_date, end_date
                
            return now, default_end
        except Exception:
            return now, default_end
    
    def _parse_date_with_year(self, date_str: str, year: int) -> datetime:
        """Parse date string with explicit year"""
        try:
            # Remove year if present and add our own
            date_str = re.sub(r'\s*,\s*[0-9]{4}', '', date_str).strip()
            date_str = f"{date_str}, {year}"
            
            for fmt in ['%b %d, %Y', '%B %d, %Y']:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
                    
            return datetime.utcnow()
        except Exception:
            return datetime.utcnow()
