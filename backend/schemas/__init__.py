# Schema/DTO layer for request/response validation
from .requests import (
    UserProfileUpdate,
    CompetitionSaveRequest,
    CompetitionWinRequest,
    CompetitionFilterParams,
)
from .responses import (
    SuccessResponse,
    PaginatedResponse,
    ErrorResponse,
    CompetitionResponse,
    UserProfileResponse,
    StatsResponse,
)

__all__ = [
    # Requests
    "UserProfileUpdate",
    "CompetitionSaveRequest", 
    "CompetitionWinRequest",
    "CompetitionFilterParams",
    # Responses
    "SuccessResponse",
    "PaginatedResponse",
    "ErrorResponse",
    "CompetitionResponse",
    "UserProfileResponse",
    "StatsResponse",
]
