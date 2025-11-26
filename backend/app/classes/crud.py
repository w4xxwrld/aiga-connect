from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date

from app.classes.models import Class
from app.classes.schemas import ClassCreate, ClassUpdate
from app.core.utils import (
    get_day_of_week_in_timezone,
    is_within_class_time_window,
    get_minutes_until_window_closes,
    get_datetime_in_timezone
)


async def get_all_classes(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    coach_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    include_deleted: bool = False
) -> List[Class]:
    """Get list of classes with optional filters"""
    query = select(Class).options(selectinload(Class.coach))

    if not include_deleted:
        query = Class.filter_active(query)

    if coach_id:
        query = query.where(Class.coach_id == coach_id)

    if difficulty:
        query = query.where(Class.difficulty_level == difficulty)

    query = query.offset(skip).limit(limit).order_by(Class.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


async def get_class_by_id(db: AsyncSession, class_id: int, include_deleted: bool = False) -> Optional[Class]:
    """Get class by ID"""
    query = select(Class).where(Class.id == class_id).options(selectinload(Class.coach))

    if not include_deleted:
        query = Class.filter_active(query)

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_class(db: AsyncSession, class_data: ClassCreate) -> Class:
    """Create new training class"""
    db_class = Class(**class_data.model_dump())
    db.add(db_class)
    await db.commit()
    await db.refresh(db_class)

    # Load with coach relationship
    result = await db.execute(
        select(Class)
        .where(Class.id == db_class.id)
        .options(selectinload(Class.coach))
    )
    return result.scalar_one()


async def update_class(
    db: AsyncSession,
    class_id: int,
    class_update: ClassUpdate
) -> Optional[Class]:
    """Update training class"""
    result = await db.execute(
        select(Class)
        .where(Class.id == class_id)
        .options(selectinload(Class.coach))
    )
    db_class = result.scalar_one_or_none()

    if not db_class:
        return None

    update_data = class_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_class, field, value)

    await db.commit()
    await db.refresh(db_class)
    return db_class


async def delete_class(db: AsyncSession, class_id: int) -> bool:
    """Soft delete training class"""
    result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    db_class = result.scalar_one_or_none()

    if not db_class or db_class.is_deleted:
        return False

    db_class.soft_delete()
    await db.commit()
    return True


async def get_class_participants(
    db: AsyncSession,
    class_id: int,
    class_date: Optional[date] = None
):
    """
    Get list of athletes enrolled in a class.

    Args:
        db: Database session
        class_id: ID of the class
        class_date: Optional date to filter participants for a specific session.
                   If not provided, returns all participants across all dates.
    """
    from app.bookings.models import Booking
    from app.users.models import User

    query = (
        select(User, Booking)
        .join(Booking, Booking.athlete_id == User.id)
        .where(Booking.class_id == class_id)
        .where(Booking.status.in_(['pending', 'confirmed']))
    )

    # Filter by specific date if provided
    if class_date:
        query = query.where(func.date(Booking.class_date) == class_date)

    query = query.order_by(Booking.class_date.desc())

    # Filter out soft-deleted users and bookings
    query = User.filter_active(query)
    query = Booking.filter_active(query)

    result = await db.execute(query)

    participants = []
    for user, booking in result.all():
        participants.append({
            'id': booking.id,  # Use booking ID to ensure uniqueness
            'athlete_id': user.id,  # Add athlete ID as separate field
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'birth_date': user.birth_date,
            'booking_status': booking.status.value,
            'class_date': booking.class_date,
            'is_paid': booking.is_paid,
            'payment_amount': booking.payment_amount,
            'notes': booking.notes
        })

    return participants


async def get_available_classes_for_attendance(
    db: AsyncSession,
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
    from app.bookings.models import Booking, BookingStatus

    # Get current day of week in user's timezone
    try:
        current_day = get_day_of_week_in_timezone(timezone)
        current_dt = get_datetime_in_timezone(timezone)
        current_date = current_dt.date()
    except ValueError as e:
        # Invalid timezone
        return []

    # Get all active classes that run on this day of week
    # Use PostgreSQL JSON contains operator (@>) with proper casting
    # Cast both the column and the value to JSONB since the column is JSON type
    query = (
        select(Class)
        .where(cast(Class.days_of_week, JSONB).op('@>')(cast([current_day], JSONB)))
        .options(selectinload(Class.coach))
    )
    query = Class.filter_active(query)

    result = await db.execute(query)
    classes = result.scalars().all()

    available_classes = []

    for class_obj in classes:
        # Check if current time is within attendance window
        is_within, error_msg = is_within_class_time_window(
            class_obj.start_time,
            class_obj.end_time,
            timezone
        )

        if not is_within:
            continue

        # Check if user has a confirmed booking for this class today
        booking_query = (
            select(Booking)
            .where(
                Booking.athlete_id == user_id,
                Booking.class_id == class_obj.id,
                func.date(Booking.class_date) == current_date,
                Booking.status == BookingStatus.confirmed
            )
        )
        booking_query = Booking.filter_active(booking_query)

        booking_result = await db.execute(booking_query)
        booking = booking_result.scalars().first()

        if not booking:
            continue

        # Calculate minutes remaining
        minutes_remaining = get_minutes_until_window_closes(
            class_obj.end_time,
            timezone
        )

        # Add to available classes
        available_classes.append({
            'class_id': class_obj.id,
            'class_name': class_obj.name,
            'start_time': str(class_obj.start_time),
            'end_time': str(class_obj.end_time),
            'minutes_remaining': minutes_remaining,
            'booking_id': booking.id
        })

    return available_classes
