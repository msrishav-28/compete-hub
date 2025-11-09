# This file makes the models directory a Python package
from .competition import Competition, CompetitionCategory, DifficultyLevel
from .user_profile import UserProfile

__all__ = [
    'Competition',
    'CompetitionCategory',
    'DifficultyLevel',
    'UserProfile'
]
