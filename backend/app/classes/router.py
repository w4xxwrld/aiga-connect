from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.classes import schemas, crud
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[schemas.ClassOut])
async def get_classes(
    skip: int = 0,
    limit: int = 100,
    coach_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить список всех активных занятий"""
    print(f"DEBUG: get_classes called with coach_id={coach_id}, skip={skip}, limit={limit}")
    if coach_id:
        # Filter by coach if coach_id is provided
        print(f"DEBUG: Filtering classes by coach_id={coach_id}")
        classes = await crud.get_classes_by_coach(db, coach_id, skip=skip, limit=limit)
    else:
        # Get all classes
        print(f"DEBUG: Getting all classes")
        classes = await crud.get_classes(db, skip=skip, limit=limit)
    print(f"DEBUG: Returning {len(classes)} classes")
    return classes

@router.post("/", response_model=schemas.ClassOut)
async def create_class(
    class_data: schemas.ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новое занятие (только для тренеров)"""
    # Debug logging
    logger.info(f"Create class request from user {current_user.id} ({current_user.full_name})")
    logger.info(f"User primary_role: {current_user.primary_role}")
    logger.info(f"User roles: {[ur.role for ur in current_user.user_roles]}")
    
    # Check if user has coach role - check both primary_role and user_roles
    has_coach_role = (
        current_user.primary_role == UserRole.coach or 
        any(ur.role == UserRole.coach for ur in current_user.user_roles)
    )
    
    logger.info(f"User has coach role: {has_coach_role}")
    
    if not has_coach_role:
        logger.warning(f"User {current_user.id} attempted to create class but is not a coach")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create classes"
        )
    
    logger.info(f"User {current_user.id} authorized to create class")
    new_class = await crud.create_class(db, class_data)
    return new_class

@router.get("/{class_id}", response_model=schemas.ClassOut)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить информацию о конкретном занятии"""
    class_obj = await crud.get_class(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    return class_obj

@router.put("/{class_id}", response_model=schemas.ClassOut)
async def update_class(
    class_id: int,
    class_update: schemas.ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить занятие (только тренер этого занятия)"""
    class_obj = await crud.get_class(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user has coach role and is the class coach
    has_coach_role = (
        current_user.primary_role == UserRole.coach or 
        any(ur.role == UserRole.coach for ur in current_user.user_roles)
    )
    
    if not has_coach_role or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can update this class"
        )
    
    updated_class = await crud.update_class(db, class_id, class_update)
    return updated_class

@router.get("/{class_id}/participants", response_model=List[schemas.ClassParticipantOut])
async def get_class_participants(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список участников занятия (только для тренера этого занятия)"""
    class_obj = await crud.get_class(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user has coach role and is the class coach
    has_coach_role = (
        current_user.primary_role == UserRole.coach or 
        any(ur.role == UserRole.coach for ur in current_user.user_roles)
    )
    
    if not has_coach_role or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can view participants"
        )
    
    participants = await crud.get_class_participants(db, class_id)
    return participants
