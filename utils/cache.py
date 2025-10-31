import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

class CompetitionCache:
    """Class to handle caching of competition data"""
    
    def __init__(self, cache_dir: str = "./data"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True, parents=True)
        self.competitions_file = self.cache_dir / "competitions.json"
        self.metadata_file = self.cache_dir / "cache_metadata.json"
    
    def save_competitions(self, competitions: List[Any], category: str) -> None:
        """Save competitions to cache"""
        # Load existing data
        data = self.load_all_competitions() or {}
        
        # Convert Competition objects to dicts if needed
        serialized = []
        for comp in competitions:
            if hasattr(comp, 'to_dict'):
                serialized.append(comp.to_dict())
            else:
                serialized.append(comp)
        
        # Update data
        data[category] = serialized
        
        # Save to file
        with open(self.competitions_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        # Update metadata
        self._update_metadata(category)
    
    def load_competitions(self, category: Optional[str] = None) -> List[Dict]:
        """Load competitions from cache"""
        if not self.competitions_file.exists():
            return [] if category is None else {}
        
        with open(self.competitions_file, 'r') as f:
            data = json.load(f)
        
        if category:
            return data.get(category, [])
        return data
    
    def load_all_competitions(self) -> Dict[str, List[Dict]]:
        """Load all competitions from cache"""
        if not self.competitions_file.exists():
            return {}
        try:
            with open(self.competitions_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    
    def is_cache_fresh(self, category: str, ttl_hours: int = 24) -> bool:
        """Check if cache is still fresh"""
        if not self.metadata_file.exists():
            return False
        
        try:
            with open(self.metadata_file, 'r') as f:
                metadata = json.load(f)
            
            last_updated = metadata.get(category, {}).get('last_updated')
            if not last_updated:
                return False
                
            last_updated_dt = datetime.fromisoformat(last_updated)
            return datetime.now() - last_updated_dt < timedelta(hours=ttl_hours)
        except (json.JSONDecodeError, ValueError):
            return False
    
    def _update_metadata(self, category: str) -> None:
        """Update metadata for a category"""
        metadata = {}
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    metadata = json.load(f)
            except json.JSONDecodeError:
                metadata = {}
        
        metadata[category] = {'last_updated': datetime.now().isoformat()}
        
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)

# Global cache instance
cache = CompetitionCache()
