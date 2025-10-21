"""Permission decorators for role-based access control."""

from fastapi import Depends, HTTPException, status
from typing import List
from app.deps import get_current_user
from app.users.models import User, UserRole


def require_role(allowed_roles: List[UserRole]):
    """
    Decorator factory to require specific roles for an endpoint.

    Args:
        allowed_roles: List of roles that are allowed to access the endpoint

    Returns:
        Dependency function that checks if user has required role
    """

    async def check_role(current_user: User = Depends(get_current_user)):
        # Get all user roles from user_roles relationship
        user_roles = [ur.role for ur in current_user.user_roles]

        # Check if user has any of the allowed roles
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only {', '.join([role.value for role in allowed_roles])} can access this endpoint",
            )

        return current_user

    return check_role


def require_coach(current_user: User = Depends(get_current_user)):
    """Require user to be a coach."""
    user_roles = [ur.role for ur in current_user.user_roles]

    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can access this endpoint",
        )

    return current_user


def require_athlete(current_user: User = Depends(get_current_user)):
    """Require user to be an athlete."""
    user_roles = [ur.role for ur in current_user.user_roles]

    if UserRole.athlete not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes can access this endpoint",
        )

    return current_user


def require_head_coach(current_user: User = Depends(get_current_user)):
    """Require user to be a head coach."""
    if not current_user.is_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only head coach can access this endpoint",
        )

    return current_user


def is_coach(user: User) -> bool:
    """Check if user is a coach."""
    user_roles = [ur.role for ur in user.user_roles]
    return UserRole.coach in user_roles or user.primary_role == UserRole.coach


def is_athlete(user: User) -> bool:
    """Check if user is an athlete."""
    user_roles = [ur.role for ur in user.user_roles]
    return UserRole.athlete in user_roles or user.primary_role == UserRole.athlete


def has_role(user: User, role: UserRole) -> bool:
    """
    Check if user has a specific role.

    Args:
        user: The user to check
        role: The role to check for

    Returns:
        True if user has the role, False otherwise
    """
    user_roles = [ur.role for ur in user.user_roles]
    return role in user_roles or user.primary_role == role
