from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.classes.models import Class
from app.classes.schemas import ClassCreate, ClassUpdate


async def get_all_classes(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    coach_id: Optional[int] = None,
    difficulty: Optional[str] = None
) -> List[Class]:
    """Get list of classes with optional filters"""
    query = select(Class).options(selectinload(Class.coach))

    if coach_id:
        query = query.where(Class.coach_id == coach_id)

    if difficulty:
        query = query.where(Class.difficulty_level == difficulty)

    query = query.offset(skip).limit(limit).order_by(Class.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


async def get_class_by_id(db: AsyncSession, class_id: int) -> Optional[Class]:
    """Get class by ID"""
    result = await db.execute(
        select(Class)
        .where(Class.id == class_id)
        .options(selectinload(Class.coach))
    )
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
    """Delete training class"""
    result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    db_class = result.scalar_one_or_none()

    if not db_class:
        return False

    await db.delete(db_class)
    await db.commit()
    return True


async def get_class_participants(db: AsyncSession, class_id: int):
    """Get list of athletes enrolled in a class"""
    from app.bookings.models import Booking
    from app.users.models import User

    result = await db.execute(
        select(User, Booking)
        .join(Booking, Booking.athlete_id == User.id)
        .where(Booking.class_id == class_id)
        .where(Booking.status.in_(['pending', 'confirmed']))
        .order_by(Booking.class_date.desc())
    )

    participants = []
    for user, booking in result.all():
        participants.append({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'booking_status': booking.status.value,
            'class_date': booking.class_date,
            'is_paid': booking.is_paid,
            'payment_amount': booking.payment_amount,
            'notes': booking.notes
        })

    return participants
