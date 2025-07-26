from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from app.bookings.models import Booking
from app.bookings.schemas import BookingCreate, BookingUpdate
from app.classes.models import Class

async def create_booking(db: AsyncSession, booking_data: BookingCreate, booked_by_parent_id: Optional[int]) -> Booking:
    """Создать новое бронирование"""
    db_booking = Booking(
        **booking_data.model_dump(),
        booked_by_parent_id=booked_by_parent_id
    )
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking

async def get_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Получить бронирование по ID"""
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj)
        )
    )
    return result.scalar_one_or_none()

async def get_bookings_by_parent(db: AsyncSession, parent_id: int) -> List[Booking]:
    """Получить бронирования родителя"""
    result = await db.execute(
        select(Booking)
        .where(Booking.booked_by_parent_id == parent_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj)
        )
        .order_by(Booking.class_date.desc())
    )
    return result.scalars().all()

async def get_bookings_by_athlete(db: AsyncSession, athlete_id: int) -> List[Booking]:
    """Получить бронирования спортсмена"""
    result = await db.execute(
        select(Booking)
        .where(Booking.athlete_id == athlete_id)
        .options(
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj)
        )
        .order_by(Booking.class_date.desc())
    )
    return result.scalars().all()

async def get_bookings_by_coach(db: AsyncSession, coach_id: int) -> List[Booking]:
    """Получить бронирования для занятий тренера"""
    result = await db.execute(
        select(Booking)
        .join(Class, Booking.class_id == Class.id)
        .where(Class.coach_id == coach_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj)
        )
        .order_by(Booking.class_date.desc())
    )
    return result.scalars().all()

async def cancel_booking(db: AsyncSession, booking_id: int, cancellation_reason: str) -> Optional[Booking]:
    """Отменить бронирование"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    
    if not db_booking:
        return None
    
    db_booking.status = "cancelled"
    db_booking.cancellation_reason = cancellation_reason
    db_booking.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_booking)
    return db_booking

async def update_booking(db: AsyncSession, booking_id: int, booking_update: BookingUpdate) -> Optional[Booking]:
    """Обновить бронирование"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    
    if not db_booking:
        return None
    
    update_data = booking_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_booking, field, value)
    
    db_booking.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_booking)
    return db_booking
