"""Tests for user endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.users import crud
from app.users.models import User


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, sample_user_data):
    """Test user registration."""
    response = await client.post("/users/", json=sample_user_data)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_user_data["email"]
    assert data["full_name"] == sample_user_data["full_name"]
    assert "hashed_password" not in data  # Password should not be returned


@pytest.mark.asyncio
async def test_create_duplicate_user(client: AsyncClient, sample_user_data):
    """Test that duplicate email registration fails."""
    # Create first user
    await client.post("/users/", json=sample_user_data)

    # Try to create duplicate
    response = await client.post("/users/", json=sample_user_data)

    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, sample_user_data):
    """Test user login."""
    # Register user
    await client.post("/users/", json=sample_user_data)

    # Login
    login_data = {
        "iin": sample_user_data["iin"],
        "password": sample_user_data["password"],
    }
    response = await client.post("/users/login", json=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, sample_user_data):
    """Test login with invalid credentials."""
    # Register user
    await client.post("/users/", json=sample_user_data)

    # Try to login with wrong password
    login_data = {
        "iin": sample_user_data["iin"],
        "password": "WrongPassword123!",
    }
    response = await client.post("/users/login", json=login_data)

    assert response.status_code == 401
    assert "Invalid IIN or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, sample_user_data):
    """Test getting current user info."""
    # Register user
    await client.post("/users/", json=sample_user_data)

    # Login to get token
    login_data = {
        "iin": sample_user_data["iin"],
        "password": sample_user_data["password"],
    }
    login_response = await client.post("/users/login", json=login_data)
    token = login_response.json()["access_token"]

    # Get current user info
    response = await client.get(
        "/users/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_user_data["email"]
    assert data["iin"] == sample_user_data["iin"]


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, sample_user_data):
    """Test refreshing access token."""
    # Register and login
    await client.post("/users/", json=sample_user_data)
    login_data = {
        "iin": sample_user_data["iin"],
        "password": sample_user_data["password"],
    }
    login_response = await client.post("/users/login", json=login_data)
    refresh_token = login_response.json()["refresh_token"]

    # Refresh token
    response = await client.post(
        "/users/refresh", json={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_rate_limiting_login(client: AsyncClient, sample_user_data):
    """Test rate limiting on login endpoint."""
    # Register user
    await client.post("/users/", json=sample_user_data)

    login_data = {
        "iin": sample_user_data["iin"],
        "password": sample_user_data["password"],
    }

    # Make multiple login requests (rate limit is 5 per minute)
    for i in range(6):
        response = await client.post("/users/login", json=login_data)

        if i < 5:
            assert response.status_code in [200, 401]  # Either success or wrong credentials
        else:
            # 6th request should be rate limited
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["detail"]
