"""Business logic for training classes operations"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from . import crud, schemas, models
from app.users.models import User, UserRole


class ClassesService:
    """Business logic service for training classes"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_classes(
        self,
        skip: int = 0,
        limit: int = 100,
        coach_id: Optional[int] = None,
        difficulty: Optional[str] = None
    ) -> List[models.Class]:
        """Get a list of all classes with filters"""
        return await crud.get_all_classes(
            self.db,
            skip=skip,
            limit=limit,
            coach_id=coach_id,
            difficulty=difficulty
        )
    
    async def create_class(
        self,
        class_data: schemas.ClassCreate,
        current_user: User
    ) -> models.Class:
        """Create a new class (for coaches only)"""
        if current_user.primary_role != UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can create classes"
            )
        
        return await crud.create_class(self.db, class_data)
    
    async def get_class_by_id(self, class_id: int) -> models.Class:
        """Get class by ID"""
        class_obj = await crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
        return class_obj
    
    async def update_class(
        self,
        class_id: int,
        class_update: schemas.ClassUpdate,
        current_user: User
    ) -> models.Class:
        """Update class (only the coach of this class)"""
        class_obj = await crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Check access rights
        if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the class coach can update this class"
            )
        
        return await crud.update_class(self.db, class_id, class_update)
    
    async def delete_class(
        self,
        class_id: int,
        current_user: User
    ):
        """Delete class (only the coach of this class)"""
        class_obj = await crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Check access rights
        if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the class coach can delete this class"
            )
        
        await crud.delete_class(self.db, class_id)
    
    async def get_class_participants(
        self,
        class_id: int,
        current_user: User
    ) -> List:
        """Get class participants (only the coach of this class)"""
        class_obj = await crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Check access rights
        if current_user.primary_role != UserRole.coach or class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the class coach can view participants"
            )

        return await crud.get_class_participants(self.db, class_id)

    async def get_available_classes_for_attendance(
        self,
        timezone: str,
        user_id: int
    ) -> List[dict]:
        """
        Get classes available for attendance marking.

        Returns classes that:
        - Run on today's day of week (in user's timezone)
        - Are within the attendance window (30 min before start to 30 min after end)
        - User has a confirmed booking for today
        """
        return await crud.get_available_classes_for_attendance(self.db, timezone, user_id)
