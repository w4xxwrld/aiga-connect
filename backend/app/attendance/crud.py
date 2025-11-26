from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.attendance.models import Attendance
from app.attendance.schemas import AttendanceCreate
from app.core.utils import (
    get_day_of_week_in_timezone,
    is_within_class_time_window,
    get_datetime_in_timezone
)


async def mark_attendance(
    db: AsyncSession,
    athlete_id: int,
    class_id: int,
    qr_code: str,
    timezone: str
) -> Attendance:
    """
    Mark attendance for an athlete with time window validation.

    Validates:
    - Class runs on today's day of week (in user's timezone)
    - Current time is within attendance window (30 min before start to 30 min after end)
    - User has a confirmed booking for today
    - Attendance not already marked today
    """
    from app.classes.models import Class
    from app.bookings.models import Booking, BookingStatus

    # Get class details
    class_result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    class_obj = class_result.scalar_one_or_none()

    if not class_obj:
        raise ValueError("Class not found")

    # Get current datetime and day in user's timezone
    try:
        current_dt = get_datetime_in_timezone(timezone)
        current_day = get_day_of_week_in_timezone(timezone)
        current_date = current_dt.date()
    except ValueError as e:
        raise ValueError(f"Invalid timezone: {timezone}")

    # Check if class runs today
    if current_day not in class_obj.days_of_week:
        raise ValueError(f"Class does not run on {current_day.capitalize()}")

    # Check if within time window
    is_within, error_msg = is_within_class_time_window(
        class_obj.start_time,
        class_obj.end_time,
        timezone
    )

    if not is_within:
        raise ValueError(error_msg)

    # Check if user has a confirmed booking for this class today
    booking_result = await db.execute(
        select(Booking)
        .where(
            Booking.athlete_id == athlete_id,
            Booking.class_id == class_id,
            func.date(Booking.class_date) == current_date,
            Booking.status == BookingStatus.confirmed
        )
    )
    booking = booking_result.scalars().first()

    if not booking:
        raise ValueError("No confirmed booking found for this class today")

    # Check if already marked today
    existing = await db.execute(
        select(Attendance)
        .where(
            Attendance.athlete_id == athlete_id,
            Attendance.class_id == class_id,
            Attendance.attendance_date == current_date
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Attendance already marked for today")

    # Create attendance record
    db_attendance = Attendance(
        athlete_id=athlete_id,
        class_id=class_id,
        qr_code=qr_code,
        attendance_date=current_date
    )
    db.add(db_attendance)
    await db.commit()
    await db.refresh(db_attendance)
    return db_attendance


async def get_attendance_by_athlete(
    db: AsyncSession,
    athlete_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[Attendance]:
    """Get attendance records for an athlete"""
    query = select(Attendance).where(Attendance.athlete_id == athlete_id)

    if start_date:
        query = query.where(Attendance.attendance_date >= start_date)
    if end_date:
        query = query.where(Attendance.attendance_date <= end_date)

    query = query.order_by(Attendance.attendance_date.desc())

    result = await db.execute(query)
    return result.scalars().all()


async def get_attendance_by_class(
    db: AsyncSession,
    class_id: int,
    attendance_date: Optional[date] = None
) -> List[Attendance]:
    """Get attendance records for a class"""
    query = select(Attendance).where(Attendance.class_id == class_id)

    if attendance_date:
        query = query.where(Attendance.attendance_date == attendance_date)

    query = query.order_by(Attendance.marked_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


async def count_attendance_by_athlete(db: AsyncSession, athlete_id: int) -> int:
    """Count total attendance for an athlete"""
    result = await db.execute(
        select(func.count(Attendance.id)).where(Attendance.athlete_id == athlete_id)
    )
    return result.scalar()


async def get_attendance_stats_by_class(
    db: AsyncSession,
    class_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> dict:
    """Get attendance statistics for a class"""
    query = select(Attendance).where(Attendance.class_id == class_id)

    if start_date:
        query = query.where(Attendance.attendance_date >= start_date)
    if end_date:
        query = query.where(Attendance.attendance_date <= end_date)

    result = await db.execute(query)
    attendances = result.scalars().all()

    # Calculate statistics
    total_attendances = len(attendances)
    unique_athletes = len(set(a.athlete_id for a in attendances))

    return {
        "total_attendances": total_attendances,
        "unique_athletes": unique_athletes
    }
