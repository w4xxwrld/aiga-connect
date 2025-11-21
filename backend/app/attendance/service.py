"""Business logic for attendance operations"""
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from . import crud, schemas, models
from app.users.models import User, UserRole


class AttendanceService:
    """Business logic service for attendance"""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mark_attendance(
        self,
        class_id: int,
        qr_code: str,
        timezone: str,
        method: str,
        current_user: User
    ) -> models.Attendance:
        """Mark attendance (for athletes only) with time window validation"""
        if current_user.primary_role != UserRole.athlete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only athletes can mark attendance"
            )

        # Check if the class exists
        from app.classes import crud as classes_crud
        class_obj = await classes_crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        try:
            return await crud.mark_attendance(
                self.db,
                athlete_id=current_user.id,
                class_id=class_id,
                qr_code=qr_code,
                timezone=timezone,
                method=method
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    async def get_my_attendance(
        self,
        current_user: User,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[models.Attendance]:
        """Get my attendance history"""
        return await crud.get_attendance_by_athlete(
            self.db,
            athlete_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
    
    async def get_class_attendance(
        self,
        class_id: int,
        current_user: User,
        attendance_date: Optional[date] = None
    ) -> List[models.Attendance]:
        """Get class attendance (for coaches only)"""
        if current_user.primary_role != UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can view class attendance"
            )

        # Check if the class exists and belongs to this coach
        from app.classes import crud as classes_crud
        class_obj = await classes_crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
        
        if class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the class coach can view attendance"
            )
        
        attendances = await crud.get_attendance_by_class(
            self.db,
            class_id,
            attendance_date
        )
        return attendances
    
    async def count_my_attendance(
        self,
        current_user: User
    ) -> dict:
        """Count total attendance for the current user"""
        count = await crud.count_attendance_by_athlete(self.db, current_user.id)
        return {"attendance_count": count}
    
    async def get_class_attendance_stats(
        self,
        class_id: int,
        current_user: User,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> dict:
        """Get attendance statistics for a class (for coaches only)"""
        if current_user.primary_role != UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can view statistics"
            )

        # Check if the class exists and belongs to this coach
        from app.classes import crud as classes_crud
        class_obj = await classes_crud.get_class_by_id(self.db, class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
        
        if class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the class coach can view statistics"
            )
        
        stats = await crud.get_attendance_stats_by_class(
            self.db,
            class_id,
            start_date,
            end_date
        )
        return stats
