"""Common schemas shared across the application."""

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List


# Generic type for paginated responses
T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination query parameters"""
    skip: int = Field(default=0, ge=0, description="Number of records to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Number of records to return (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool

    @staticmethod
    def create(items: List[T], total: int, skip: int, limit: int) -> "PaginatedResponse[T]":
        """Create a paginated response"""
        return PaginatedResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(items)) < total
        )
