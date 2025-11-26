"""
Soft delete functionality for SQLAlchemy models.

This module provides a mixin and query utilities to implement soft deletes,
where records are marked as deleted rather than removed from the database.
This preserves data integrity and provides an audit trail.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime

from app.core.utils import get_utc_now


class SoftDeleteMixin:
    """
    Mixin to add soft delete functionality to SQLAlchemy models.

    Adds a deleted_at column that is NULL for active records and
    contains the deletion timestamp for deleted records.

    Example:
        >>> class User(Base, SoftDeleteMixin):
        ...     __tablename__ = "users"
        ...     id = Column(Integer, primary_key=True)
        ...     name = Column(String)
        ...
        >>> # Soft delete a user
        >>> user.soft_delete()
        >>> # Check if deleted
        >>> if user.is_deleted:
        ...     print("User is deleted")
        >>> # Restore a user
        >>> user.restore()
    """

    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    @property
    def is_deleted(self) -> bool:
        """Check if the record is soft deleted."""
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """Mark the record as deleted."""
        if not self.is_deleted:
            self.deleted_at = get_utc_now()

    def restore(self) -> None:
        """Restore a soft deleted record."""
        self.deleted_at = None

    @classmethod
    def filter_active(cls, stmt):
        """
        Filter a query to only include active (non-deleted) records.

        Args:
            stmt: SQLAlchemy select statement

        Returns:
            Modified statement filtering out deleted records

        Example:
            >>> stmt = select(User)
            >>> stmt = User.filter_active(stmt)
            >>> result = await db.execute(stmt)
        """
        return stmt.where(cls.deleted_at.is_(None))
