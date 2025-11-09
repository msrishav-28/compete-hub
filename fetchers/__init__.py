# This file makes the fetchers directory a Python package
# Initialize the fetchers package
from .hackathons.hackalist import HackalistFetcher
from .coding_contests.codeforces import CodeforcesFetcher
from .data_science.kaggle import KaggleFetcher
from .corporate.hackerrank import HackerRankFetcher

__all__ = [
    'HackalistFetcher',
    'CodeforcesFetcher',
    'KaggleFetcher',
    'HackerRankFetcher'
]
