from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.classes.models import Class
from app.classes.schemas import ClassCreate, ClassUpdate

async def get_classes(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Class]:
    """Получить список активных занятий"""
    result = await db.execute(
        select(Class)
        .where(Class.status == "active")
        .offset(skip)
        .limit(limit)
        .options(selectinload(Class.coach))
    )
    return result.scalars().all()

async def get_class(db: AsyncSession, class_id: int) -> Optional[Class]:
    """Получить занятие по ID"""
    result = await db.execute(
        select(Class)
        .where(Class.id == class_id)
        .options(selectinload(Class.coach))
    )
    return result.scalar_one_or_none()

async def create_class(db: AsyncSession, class_data: ClassCreate) -> Class:
    """Создать новое занятие"""
    db_class = Class(**class_data.model_dump())
    db.add(db_class)
    await db.commit()
    await db.refresh(db_class)
    return db_class

async def update_class(db: AsyncSession, class_id: int, class_update: ClassUpdate) -> Optional[Class]:
    """Обновить занятие"""
    result = await db.execute(select(Class).where(Class.id == class_id))
    db_class = result.scalar_one_or_none()
    
    if not db_class:
        return None
    
    update_data = class_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_class, field, value)
    
    await db.commit()
    await db.refresh(db_class)
    return db_class

async def get_classes_by_coach(db: AsyncSession, coach_id: int) -> List[Class]:
    """Получить занятия по тренеру"""
    result = await db.execute(
        select(Class)
        .where(Class.coach_id == coach_id)
        .options(selectinload(Class.coach))
    )
    return result.scalars().all()

async def get_classes_by_difficulty(db: AsyncSession, difficulty: str) -> List[Class]:
    """Получить занятия по уровню сложности"""
    result = await db.execute(
        select(Class)
        .where(Class.difficulty_level == difficulty)
        .where(Class.status == "active")
        .options(selectinload(Class.coach))
    )
    return result.scalars().all()
