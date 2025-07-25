from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.classes import schemas, crud

router = APIRouter()

@router.get("/", response_model=List[schemas.ClassOut])
async def get_classes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Получить список всех активных занятий"""
    classes = await crud.get_classes(db, skip=skip, limit=limit)
    return classes

@router.post("/", response_model=schemas.ClassOut)
async def create_class(
    class_data: schemas.ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новое занятие (только для тренеров)"""
    if current_user.role != UserRole.coach:
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
    
    if current_user.role != UserRole.coach or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can update this class"
        )
    
    updated_class = await crud.update_class(db, class_id, class_update)
    return updated_class
