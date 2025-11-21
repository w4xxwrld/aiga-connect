"""Utility functions for the application."""

from datetime import datetime, timezone, date, time, timedelta
from typing import Optional
from zoneinfo import ZoneInfo
import re


def get_utc_now() -> datetime:
    """Get current UTC datetime as naive (timezone-unaware) datetime.
    
    PostgreSQL TIMESTAMP WITHOUT TIME ZONE columns require naive datetimes.
    The timezone info is stripped but the time is still in UTC.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


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


def get_datetime_in_timezone(tz_string: str) -> datetime:
    """
    Get current datetime in the specified timezone.

    Args:
        tz_string: IANA timezone string (e.g., "Asia/Almaty", "America/New_York")

    Returns:
        Current datetime in the specified timezone (timezone-aware)
    """
    try:
        tz = ZoneInfo(tz_string)
        return datetime.now(tz)
    except Exception as e:
        raise ValueError(f"Invalid timezone: {tz_string}") from e


def get_day_of_week_in_timezone(tz_string: str) -> str:
    """
    Get current day of week in the specified timezone.

    Args:
        tz_string: IANA timezone string (e.g., "Asia/Almaty", "America/New_York")

    Returns:
        Day of week as lowercase string (e.g., "monday", "tuesday")
    """
    current_dt = get_datetime_in_timezone(tz_string)
    return current_dt.strftime("%A").lower()


def is_within_class_time_window(
    class_start_time: time,
    class_end_time: time,
    tz_string: str,
    buffer_minutes: int = 30
) -> tuple[bool, Optional[str]]:
    """
    Check if current time is within the class attendance window.

    Window is: (class_start_time - buffer_minutes) to (class_end_time + buffer_minutes)

    Args:
        class_start_time: Class start time (time object)
        class_end_time: Class end time (time object)
        tz_string: IANA timezone string for the user
        buffer_minutes: Buffer time in minutes before start and after end (default 30)

    Returns:
        Tuple of (is_within_window, error_message)
        - is_within_window: True if current time is within the window
        - error_message: None if within window, otherwise descriptive error message
    """
    try:
        current_dt = get_datetime_in_timezone(tz_string)
        current_date = current_dt.date()
        current_time = current_dt.time()

        # Create datetime objects for window calculation
        start_datetime = datetime.combine(current_date, class_start_time)
        end_datetime = datetime.combine(current_date, class_end_time)

        # Apply buffer
        window_start = start_datetime - timedelta(minutes=buffer_minutes)
        window_end = end_datetime + timedelta(minutes=buffer_minutes)

        # Convert current time to datetime for comparison
        current_datetime = datetime.combine(current_date, current_time)

        if current_datetime < window_start:
            return False, f"Attendance window opens at {window_start.strftime('%H:%M')}"
        elif current_datetime > window_end:
            return False, f"Attendance window closed at {window_end.strftime('%H:%M')}"
        else:
            return True, None

    except Exception as e:
        return False, f"Error checking time window: {str(e)}"


def get_minutes_until_window_closes(
    class_end_time: time,
    tz_string: str,
    buffer_minutes: int = 30
) -> int:
    """
    Calculate minutes remaining until attendance window closes.

    Args:
        class_end_time: Class end time (time object)
        tz_string: IANA timezone string for the user
        buffer_minutes: Buffer time in minutes after class end (default 30)

    Returns:
        Minutes remaining until window closes (0 if already closed or negative)
    """
    try:
        current_dt = get_datetime_in_timezone(tz_string)
        current_date = current_dt.date()

        # Create datetime for window end
        end_datetime = datetime.combine(current_date, class_end_time)
        window_end = end_datetime + timedelta(minutes=buffer_minutes)

        # Calculate difference
        current_datetime = datetime.combine(current_date, current_dt.time())
        diff = window_end - current_datetime

        return max(0, int(diff.total_seconds() / 60))

    except Exception:
        return 0
