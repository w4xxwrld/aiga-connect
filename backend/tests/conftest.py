"""Pytest configuration and fixtures."""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.database import Base
from app.deps import get_db
from app.config import settings


# Test database URL (use a separate test database)
TEST_DATABASE_URL = settings.DATABASE_URL.replace("/postgres", "/postgres_test")


# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,  # No connection pooling for tests
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with overridden database dependency."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "iin": "123456789012",
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "+77012345678",
        "birth_date": "2000-01-01",
        "password": "SecurePassword123!",
        "primary_role": "athlete",
        "additional_roles": [],
        "is_head_coach": False,
    }


@pytest.fixture
def sample_coach_data():
    """Sample coach data for testing."""
    return {
        "iin": "987654321098",
        "full_name": "Test Coach",
        "email": "coach@example.com",
        "phone": "+77012345679",
        "birth_date": "1990-01-01",
        "password": "CoachPassword123!",
        "primary_role": "coach",
        "additional_roles": [],
        "is_head_coach": False,
    }
