"""Utility functions for the application."""

from datetime import datetime, timezone, date
from typing import Optional
import re


def get_utc_now() -> datetime:
    """Get current UTC datetime with timezone information."""
    return datetime.now(timezone.utc)


def calculate_age(birth_date: date, reference_date: Optional[date] = None) -> int:
    """
    Calculate age based on birth date.

    Args:
        birth_date: The date of birth
        reference_date: The reference date to calculate age against (defaults to today)

    Returns:
        Age in years
    """
    if reference_date is None:
        reference_date = date.today()

    age = reference_date.year - birth_date.year

    # Adjust if birthday hasn't occurred yet this year
    if reference_date.month < birth_date.month or (
        reference_date.month == birth_date.month and reference_date.day < birth_date.day
    ):
        age -= 1

    return age


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.

    Requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character

    Args:
        password: The password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"

    return True, None
