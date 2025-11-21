from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.classes import schemas
from app.classes.service import ClassesService


router = APIRouter()


@router.get("/", response_model=List[schemas.ClassOut])
async def get_classes(
    skip: int = 0,
    limit: int = 100,
    coach_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get list of all training classes with optional filters"""
    service = ClassesService(db)
    return await service.get_classes(skip, limit, coach_id, difficulty)


@router.get("/available-for-attendance")
async def get_available_classes_for_attendance(
    timezone: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get classes available for attendance marking.

    Returns classes that:
    - Run on today's day of week (in user's timezone)
    - Are within the attendance window (30 min before start to 30 min after end)
    - User has a confirmed booking for today
    """
    from app.attendance.schemas import AvailableClassForAttendance
    service = ClassesService(db)
    return await service.get_available_classes_for_attendance(timezone, current_user.id)


@router.post("/", response_model=schemas.ClassOut, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: schemas.ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new training class (coaches only)"""
    service = ClassesService(db)
    return await service.create_class(class_data, current_user)


@router.get("/{class_id}", response_model=schemas.ClassOut)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get training class by ID"""
    service = ClassesService(db)
    return await service.get_class_by_id(class_id)


@router.put("/{class_id}", response_model=schemas.ClassOut)
async def update_class(
    class_id: int,
    class_update: schemas.ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update training class (only the class coach)"""
    service = ClassesService(db)
    return await service.update_class(class_id, class_update, current_user)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete training class (only the class coach)"""
    service = ClassesService(db)
    await service.delete_class(class_id, current_user)


@router.get("/{class_id}/participants", response_model=List[schemas.ClassParticipantOut])
async def get_class_participants(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of class participants (only the class coach)"""
    service = ClassesService(db)
    return await service.get_class_participants(class_id, current_user)
