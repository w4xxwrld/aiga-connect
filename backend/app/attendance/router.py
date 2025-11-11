from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.deps import get_db, get_current_user, require_coach
from app.users.models import User, UserRole
from app.attendance import schemas
from app.attendance.service import AttendanceService


router = APIRouter()


@router.post("/generate-qr", response_model=schemas.GenerateQRCodeResponse)
async def generate_qr_code(
    request: schemas.GenerateQRCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Generate QR code for class attendance (coaches only)"""
    service = AttendanceService(db)
    return await service.generate_qr_code(request.class_id, current_user)


@router.post("/mark", response_model=schemas.AttendanceOut, status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    request: schemas.MarkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark attendance for current user (athletes only)"""
    service = AttendanceService(db)
    return await service.mark_attendance(
        request.class_id,
        request.qr_code,
        request.method,
        current_user
    )


@router.get("/my-attendance", response_model=List[schemas.AttendanceOut])
async def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance history for current user"""
    service = AttendanceService(db)
    return await service.get_my_attendance(current_user, start_date, end_date)


@router.get("/my-attendance/count")
async def get_my_attendance_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total attendance count for current user"""
    service = AttendanceService(db)
    return await service.count_my_attendance(current_user)


@router.get("/class/{class_id}", response_model=List[schemas.AttendanceOut])
async def get_class_attendance(
    class_id: int,
    attendance_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Get attendance for a class (coaches only)"""
    service = AttendanceService(db)
    return await service.get_class_attendance(class_id, current_user, attendance_date)


@router.get("/class/{class_id}/stats")
async def get_class_attendance_stats(
    class_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Get attendance statistics for a class (coaches only)"""
    service = AttendanceService(db)
    return await service.get_class_attendance_stats(
        class_id,
        current_user,
        start_date,
        end_date
    )
