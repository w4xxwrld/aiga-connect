from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import date

from app.users import models, schemas
from app.core.security import get_password_hash, verify_password


async def get_user_by_phone(db: AsyncSession, phone: str) -> Optional[models.User]:
    """Get user by phone number"""
    result = await db.execute(
        select(models.User).where(models.User.phone == phone)
    )
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[models.User]:
    """Get user by ID"""
    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    return result.scalars().first()


async def create_user(db: AsyncSession, user: schemas.UserCreate) -> models.User:
    """Create a new user"""
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)

    # Determine role_status based on role
    role_status = None
    if user.primary_role == models.UserRole.coach:
        role_status = models.RoleStatus.pending  # Coaches need approval
    # Athletes and admins don't need approval status

    db_user = models.User(
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        photo_url=user.photo_url,
        email=user.email,
        birth_date=user.birth_date,
        hashed_password=hashed_password,
        primary_role=user.primary_role,
        role_status=role_status,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(
    db: AsyncSession,
    user_id: int,
    user_update: schemas.UserCreate
) -> Optional[models.User]:
    """Update user information"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    user.first_name = user_update.first_name
    user.last_name = user_update.last_name
    user.photo_url = user_update.photo_url
    user.email = user_update.email
    user.birth_date = user_update.birth_date
    user.primary_role = user_update.primary_role

    if user_update.password:
        user.hashed_password = get_password_hash(user_update.password)

    await db.commit()
    await db.refresh(user)
    return user


async def get_all_coaches(db: AsyncSession) -> List[models.User]:
    """Get all users with coach role"""
    result = await db.execute(
        select(models.User).where(models.User.primary_role == models.UserRole.coach)
    )
    return result.scalars().all()


async def get_pending_coaches(db: AsyncSession) -> List[models.User]:
    """Get all coaches with pending status"""
    result = await db.execute(
        select(models.User).where(
            models.User.primary_role == models.UserRole.coach,
            models.User.role_status == models.RoleStatus.pending
        )
    )
    return result.scalars().all()


async def get_all_athletes(db: AsyncSession) -> List[models.User]:
    """Get all users with athlete role"""
    result = await db.execute(
        select(models.User).where(models.User.primary_role == models.UserRole.athlete)
    )
    return result.scalars().all()


async def get_all_users(db: AsyncSession) -> List[models.User]:
    """Get all users"""
    result = await db.execute(
        select(models.User).order_by(models.User.created_at.desc())
    )
    return result.scalars().all()


async def update_role_status(
    db: AsyncSession,
    user_id: int,
    new_status: models.RoleStatus
) -> Optional[models.User]:
    """Update user's role status (for admin approval/decline)"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    user.role_status = new_status
    await db.commit()
    await db.refresh(user)
    return user


async def get_users_by_phones(
    db: AsyncSession,
    phone_numbers: List[str]
) -> List[models.User]:
    """Get multiple users by phone numbers"""
    result = await db.execute(
        select(models.User).where(models.User.phone.in_(phone_numbers))
    )
    return result.scalars().all()