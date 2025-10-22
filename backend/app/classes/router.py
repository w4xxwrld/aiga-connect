from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.classes import schemas, crud


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
    classes = await crud.get_all_classes(
        db,
        skip=skip,
        limit=limit,
        coach_id=coach_id,
        difficulty=difficulty
    )
    return classes


@router.post("/", response_model=schemas.ClassOut, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: schemas.ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new training class (coaches only)"""
    # Only coaches can create classes
    if current_user.primary_role != UserRole.coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create classes"
        )

    new_class = await crud.create_class(db, class_data)
    return new_class


@router.get("/{class_id}", response_model=schemas.ClassOut)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get training class by ID"""
    class_obj = await crud.get_class_by_id(db, class_id)
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
    """Update training class (only the class coach)"""
    class_obj = await crud.get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Only the class coach can update
    if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can update this class"
        )

    updated_class = await crud.update_class(db, class_id, class_update)
    return updated_class


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete training class (only the class coach)"""
    class_obj = await crud.get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Only the class coach can delete
    if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can delete this class"
        )

    await crud.delete_class(db, class_id)


@router.get("/{class_id}/participants", response_model=List[schemas.ClassParticipantOut])
async def get_class_participants(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of class participants (only the class coach)"""
    class_obj = await crud.get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Only the class coach can view participants
    if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can view participants"
        )

    participants = await crud.get_class_participants(db, class_id)
    return participants
