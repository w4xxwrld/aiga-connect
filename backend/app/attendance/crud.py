from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.attendance.models import Attendance
from app.attendance.schemas import AttendanceCreate


async def mark_attendance(
    db: AsyncSession,
    athlete_id: int,
    class_id: int,
    qr_code: str,
    method: str = "qr_scan"
) -> Attendance:
    """Mark attendance for an athlete"""
    # Check if already marked today
    today = date.today()
    existing = await db.execute(
        select(Attendance)
        .where(
            Attendance.athlete_id == athlete_id,
            Attendance.class_id == class_id,
            Attendance.attendance_date == today
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Attendance already marked for today")

    # Create attendance record
    db_attendance = Attendance(
        athlete_id=athlete_id,
        class_id=class_id,
        qr_code=qr_code,
        attendance_date=today,
        method=method
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
    qr_scan_count = sum(1 for a in attendances if a.method == "qr_scan")
    manual_entry_count = sum(1 for a in attendances if a.method == "manual_entry")

    return {
        "total_attendances": total_attendances,
        "unique_athletes": unique_athletes,
        "qr_scan_count": qr_scan_count,
        "manual_entry_count": manual_entry_count
    }
