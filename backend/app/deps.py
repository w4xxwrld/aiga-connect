from fastapi import Depends, HTTPException, status, Header
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.users import crud
from app.users.schemas import UserRole


# Database dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user from JWT token in Authorization header"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization:
        raise credentials_exception

    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise credentials_exception
    except ValueError:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception

        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await crud.get_user_by_phone(db, phone)
    if user is None:
        raise credentials_exception

    return user


def require_role(required_role: UserRole):
    """Dependency to require specific user role"""
    async def role_checker(user=Depends(get_current_user)):
        if user.primary_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return role_checker


# Convenience dependencies for specific roles
require_coach = require_role(UserRole.coach)
require_athlete = require_role(UserRole.athlete)
require_admin = require_role(UserRole.admin)


# Async function for WebSocket authentication
async def get_current_user_websocket(token: str):
    """Authenticate user for WebSocket connections"""
    try:
        payload = decode_access_token(token)
        if payload is None:
            return None

        phone: str = payload.get("sub")
        if phone is None:
            return None
    except JWTError:
        return None

    # Create async session for WebSocket
    async with AsyncSessionLocal() as db:
        user = await crud.get_user_by_phone(db, phone)
        return user
