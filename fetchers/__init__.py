# This file makes the fetchers directory a Python package
# Initialize the fetchers package
from .hackathons.hackalist import HackalistFetcher

__all__ = ['HackalistFetcher']
