from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.deps import get_db, get_current_user, require_coach
from app.users.models import User, UserRole
from app.attendance import schemas, crud
from app.classes import crud as classes_crud


router = APIRouter()


@router.post("/generate-qr", response_model=schemas.GenerateQRCodeResponse)
async def generate_qr_code(
    request: schemas.GenerateQRCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Generate QR code for class attendance (coaches only)"""
    # Verify class exists and belongs to this coach
    class_obj = await classes_crud.get_class_by_id(db, request.class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    if class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class coach can generate QR codes"
        )

    qr_code = await crud.generate_qr_code_for_class(request.class_id)

    return {
        "qr_code": qr_code,
        "class_id": request.class_id,
        "expires_at": datetime.utcnow() + timedelta(hours=2)  # Code valid for 2 hours
    }


@router.post("/mark", response_model=schemas.AttendanceOut, status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    request: schemas.MarkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark attendance for current user (athletes only)"""
    # Only athletes can mark attendance
    if current_user.primary_role != UserRole.athlete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes can mark attendance"
        )

    # Verify class exists
    class_obj = await classes_crud.get_class_by_id(db, request.class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    try:
        attendance = await crud.mark_attendance(
            db,
            athlete_id=current_user.id,
            class_id=request.class_id,
            qr_code=request.qr_code,
            method=request.method
        )
        return attendance
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-attendance", response_model=List[schemas.AttendanceOut])
async def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance history for current user"""
    attendances = await crud.get_attendance_by_athlete(
        db,
        athlete_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    return attendances


@router.get("/my-attendance/count")
async def get_my_attendance_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total attendance count for current user"""
    count = await crud.count_attendance_by_athlete(db, current_user.id)
    return {"attendance_count": count}


@router.get("/class/{class_id}", response_model=List[schemas.AttendanceOut])
async def get_class_attendance(
    class_id: int,
    attendance_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Get attendance for a class (coaches only)"""
    # Verify class exists and belongs to this coach
    class_obj = await classes_crud.get_class_by_id(db, class_id)
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

    attendances = await crud.get_attendance_by_class(db, class_id, attendance_date)
    return attendances


@router.get("/class/{class_id}/stats")
async def get_class_attendance_stats(
    class_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach)
):
    """Get attendance statistics for a class (coaches only)"""
    # Verify class exists and belongs to this coach
    class_obj = await classes_crud.get_class_by_id(db, class_id)
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

    stats = await crud.get_attendance_stats_by_class(db, class_id, start_date, end_date)
    return stats
