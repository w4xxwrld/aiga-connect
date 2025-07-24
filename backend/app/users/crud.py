from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.users import models, schemas
from app.core.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User).where(models.User.email == email)
    )
    return result.scalars().first()


async def get_user_by_iin(db: AsyncSession, iin: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User).where(models.User.iin == iin)
    )
    return result.scalars().first()


async def create_user(db: AsyncSession, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        iin=user.iin,
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def authenticate_user(db: AsyncSession, iin: str, password: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User).where(models.User.iin == iin)
    )
    user = result.scalars().first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user