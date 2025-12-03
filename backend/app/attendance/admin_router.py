from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from app.deps import get_db, require_admin
from app.users.models import User
from app.attendance import crud, schemas


router = APIRouter()


@router.get("/list", response_model=schemas.AdminAttendanceListResponse)
async def list_all_attendance(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    class_id: Optional[int] = Query(None, description="Filter by class ID"),
    athlete_id: Optional[int] = Query(None, description="Filter by athlete ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Maximum records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all attendance records with optional filters (admin only).

    Query parameters:
    - **start_date**: Filter attendance from this date
    - **end_date**: Filter attendance until this date
    - **class_id**: Filter by specific class
    - **athlete_id**: Filter by specific athlete
    - **skip**: Pagination offset
    - **limit**: Maximum records per page (max 200)
    """
    attendances = await crud.get_all_attendance(
        db,
        start_date=start_date,
        end_date=end_date,
        class_id=class_id,
        athlete_id=athlete_id,
        skip=skip,
        limit=limit
    )

    total = await crud.count_all_attendance(
        db,
        start_date=start_date,
        end_date=end_date,
        class_id=class_id,
        athlete_id=athlete_id
    )

    # Convert to response format with relationships
    attendance_list = []
    for attendance in attendances:
        athlete_data = None
        if attendance.athlete:
            athlete_data = schemas.AthleteSimple(
                id=attendance.athlete.id,
                first_name=attendance.athlete.first_name,
                last_name=attendance.athlete.last_name,
                phone=attendance.athlete.phone
            )

        class_data = None
        if attendance.class_obj:
            coach_data = None
            if attendance.class_obj.coach:
                coach_data = schemas.CoachSimple(
                    id=attendance.class_obj.coach.id,
                    first_name=attendance.class_obj.coach.first_name,
                    last_name=attendance.class_obj.coach.last_name
                )
            class_data = schemas.ClassSimple(
                id=attendance.class_obj.id,
                name=attendance.class_obj.name,
                start_time=str(attendance.class_obj.start_time),
                coach=coach_data
            )

        attendance_list.append(schemas.AdminAttendanceOut(
            id=attendance.id,
            athlete_id=attendance.athlete_id,
            class_id=attendance.class_id,
            qr_code=attendance.qr_code,
            attendance_date=attendance.attendance_date,
            marked_at=attendance.marked_at,
            created_at=attendance.created_at,
            athlete=athlete_data,
            class_obj=class_data
        ))

    return schemas.AdminAttendanceListResponse(
        attendances=attendance_list,
        total=total
    )


@router.get("/stats", response_model=schemas.AdminAttendanceStats)
async def get_attendance_statistics(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get overall attendance statistics (admin only).

    Returns:
    - **total_attendances**: Total number of attendance records
    - **unique_athletes**: Number of unique athletes who attended
    - **unique_classes**: Number of classes with attendance
    - **today_count**: Number of attendances marked today
    """
    stats = await crud.get_overall_attendance_stats(
        db,
        start_date=start_date,
        end_date=end_date
    )

    return schemas.AdminAttendanceStats(**stats)
