"""Tests for utility functions."""

import pytest
from datetime import date, datetime, timezone

from app.core.utils import calculate_age, get_utc_now


def test_calculate_age_basic():
    """Test basic age calculation."""
    birth_date = date(2000, 1, 1)
    reference_date = date(2024, 1, 1)

    age = calculate_age(birth_date, reference_date)
    assert age == 24


def test_calculate_age_before_birthday():
    """Test age calculation before birthday this year."""
    birth_date = date(2000, 6, 15)
    reference_date = date(2024, 3, 1)  # Before birthday

    age = calculate_age(birth_date, reference_date)
    assert age == 23  # Still 23, not yet 24


def test_calculate_age_after_birthday():
    """Test age calculation after birthday this year."""
    birth_date = date(2000, 6, 15)
    reference_date = date(2024, 8, 1)  # After birthday

    age = calculate_age(birth_date, reference_date)
    assert age == 24


def test_calculate_age_on_birthday():
    """Test age calculation on exact birthday."""
    birth_date = date(2000, 6, 15)
    reference_date = date(2024, 6, 15)  # Exact birthday

    age = calculate_age(birth_date, reference_date)
    assert age == 24


def test_calculate_age_child():
    """Test age calculation for a child."""
    birth_date = date(2020, 1, 1)
    reference_date = date(2024, 1, 1)

    age = calculate_age(birth_date, reference_date)
    assert age == 4


def test_get_utc_now_timezone():
    """Test that get_utc_now returns timezone-aware datetime."""
    now = get_utc_now()

    assert isinstance(now, datetime)
    assert now.tzinfo == timezone.utc


def test_get_utc_now_current():
    """Test that get_utc_now returns current time."""
    before = datetime.now(timezone.utc)
    now = get_utc_now()
    after = datetime.now(timezone.utc)

    # The returned time should be between before and after
    assert before <= now <= after
