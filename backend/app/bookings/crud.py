from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from app.bookings.models import Booking, IndividualTrainingRequest, IndividualTrainingStatus
from app.bookings.schemas import BookingCreate, BookingUpdate, IndividualTrainingRequestCreate, IndividualTrainingRequestUpdate
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
    
    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == db_booking.id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()

async def get_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Получить бронирование по ID"""
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj).selectinload(Class.coach)
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
            selectinload(Booking.class_obj).selectinload(Class.coach)
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
            selectinload(Booking.class_obj).selectinload(Class.coach)
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
            selectinload(Booking.class_obj).selectinload(Class.coach)
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
    
    await db.commit()
    await db.refresh(db_booking)
    return db_booking

async def approve_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Подтвердить бронирование"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    
    if not db_booking:
        return None
    
    db_booking.status = "confirmed"
    db_booking.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_booking)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()

async def decline_booking(db: AsyncSession, booking_id: int, decline_reason: str) -> Optional[Booking]:
    """Отклонить бронирование"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    
    if not db_booking:
        return None
    
    db_booking.status = "cancelled"
    db_booking.cancellation_reason = decline_reason
    db_booking.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_booking)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.booked_by_parent),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()

async def create_individual_training_request(db: AsyncSession, request_data: IndividualTrainingRequestCreate, requested_by_parent_id: Optional[int]) -> IndividualTrainingRequest:
    """Создать запрос на индивидуальную тренировку"""
    db_request = IndividualTrainingRequest(
        **request_data.model_dump(),
        requested_by_parent_id=requested_by_parent_id
    )
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == db_request.id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
    )
    return result.scalar_one()

async def get_individual_training_request(db: AsyncSession, request_id: int) -> Optional[IndividualTrainingRequest]:
    """Получить запрос на индивидуальную тренировку по ID"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
    )
    return result.scalar_one_or_none()

async def get_individual_training_requests_by_athlete(db: AsyncSession, athlete_id: int) -> List[IndividualTrainingRequest]:
    """Получить запросы на индивидуальные тренировки спортсмена"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.athlete_id == athlete_id)
        .options(
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
        .order_by(IndividualTrainingRequest.requested_date.desc())
    )
    return result.scalars().all()

async def get_individual_training_requests_by_coach(db: AsyncSession, coach_id: int) -> List[IndividualTrainingRequest]:
    """Получить запросы на индивидуальные тренировки для тренера"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.coach_id == coach_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
        .order_by(IndividualTrainingRequest.requested_date.desc())
    )
    return result.scalars().all()

async def get_pending_individual_training_requests_by_coach(db: AsyncSession, coach_id: int) -> List[IndividualTrainingRequest]:
    """Получить ожидающие запросы на индивидуальные тренировки для тренера (максимум 10)"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(
            IndividualTrainingRequest.coach_id == coach_id,
            IndividualTrainingRequest.status == IndividualTrainingStatus.pending
        )
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
        .order_by(IndividualTrainingRequest.requested_date.asc())
        .limit(10)
    )
    return result.scalars().all()

async def count_pending_individual_training_requests_by_coach(db: AsyncSession, coach_id: int) -> int:
    """Подсчитать количество ожидающих запросов на индивидуальные тренировки для тренера"""
    result = await db.execute(
        select(func.count(IndividualTrainingRequest.id))
        .where(
            IndividualTrainingRequest.coach_id == coach_id,
            IndividualTrainingRequest.status == IndividualTrainingStatus.pending
        )
    )
    return result.scalar()

async def accept_individual_training_request(db: AsyncSession, request_id: int, update_data: IndividualTrainingRequestUpdate) -> Optional[IndividualTrainingRequest]:
    """Принять запрос на индивидуальную тренировку"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()
    
    if not db_request:
        return None
    
    # Update the request with scheduled details
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_request, field, value)
    
    db_request.status = IndividualTrainingStatus.accepted
    db_request.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_request)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
    )
    return result.scalar_one()

async def decline_individual_training_request(db: AsyncSession, request_id: int, decline_reason: str) -> Optional[IndividualTrainingRequest]:
    """Отклонить запрос на индивидуальную тренировку"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()
    
    if not db_request:
        return None
    
    db_request.status = IndividualTrainingStatus.declined
    db_request.decline_reason = decline_reason
    db_request.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_request)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
    )
    return result.scalar_one()

async def complete_individual_training_request(db: AsyncSession, request_id: int) -> Optional[IndividualTrainingRequest]:
    """Завершить индивидуальную тренировку"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()
    
    if not db_request:
        return None
    
    db_request.status = IndividualTrainingStatus.completed
    db_request.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_request)
    
    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
            selectinload(IndividualTrainingRequest.requested_by_parent)
        )
    )
    return result.scalar_one()
