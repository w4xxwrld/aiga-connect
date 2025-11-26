from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date, time as datetime_time

from app.core.utils import get_utc_now
from app.bookings.models import Booking, BookingStatus, IndividualTrainingRequest, IndividualTrainingStatus
from app.bookings.schemas import BookingCreate, BookingUpdate, IndividualTrainingRequestCreate, IndividualTrainingRequestUpdate
from app.classes.models import Class


async def create_booking(db: AsyncSession, booking_data: BookingCreate) -> Booking:
    """Create new booking"""
    # Get the class to fetch its start_time
    class_result = await db.execute(
        select(Class).where(Class.id == booking_data.class_id)
    )
    class_obj = class_result.scalar_one_or_none()

    if not class_obj:
        raise ValueError("Class not found")

    # Parse the class_date (which might be just a date or datetime)
    booking_dict = booking_data.model_dump()
    class_date_value = booking_dict['class_date']

    # If class_date is a string, parse it
    if isinstance(class_date_value, str):
        # Try to parse as datetime first, if it fails, parse as date
        try:
            parsed_date = datetime.fromisoformat(class_date_value.replace('Z', '+00:00'))
            # If it's already a full datetime, extract just the date part
            booking_date = parsed_date.date()
        except ValueError:
            # Parse as date only
            booking_date = date.fromisoformat(class_date_value)
    elif isinstance(class_date_value, datetime):
        booking_date = class_date_value.date()
    else:
        booking_date = class_date_value

    # Check for duplicate booking (same athlete, class, and date)
    existing_booking_result = await db.execute(
        select(Booking)
        .where(
            Booking.athlete_id == booking_data.athlete_id,
            Booking.class_id == booking_data.class_id,
            func.date(Booking.class_date) == booking_date,
            Booking.status != BookingStatus.cancelled
        )
    )
    existing_booking = existing_booking_result.scalars().first()

    if existing_booking:
        raise ValueError("You have already booked this class for this date")

    # Combine the booking date with the class start time
    class_datetime = datetime.combine(booking_date, class_obj.start_time)

    # Update the booking data with the proper datetime
    booking_dict['class_date'] = class_datetime

    db_booking = Booking(**booking_dict)
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)

    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == db_booking.id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()


async def get_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Get booking by ID"""
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one_or_none()


async def get_bookings_by_athlete(db: AsyncSession, athlete_id: int) -> List[Booking]:
    """Get athlete's bookings"""
    result = await db.execute(
        select(Booking)
        .where(Booking.athlete_id == athlete_id)
        .options(
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
        .order_by(Booking.class_date.desc())
    )
    return result.scalars().all()


async def get_bookings_by_coach(db: AsyncSession, coach_id: int) -> List[Booking]:
    """Get bookings for coach's classes"""
    result = await db.execute(
        select(Booking)
        .join(Class, Booking.class_id == Class.id)
        .where(Class.coach_id == coach_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
        .order_by(Booking.class_date.desc())
    )
    return result.scalars().all()


async def update_booking(db: AsyncSession, booking_id: int, booking_update: BookingUpdate) -> Optional[Booking]:
    """Update booking"""
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


async def cancel_booking(db: AsyncSession, booking_id: int, cancellation_reason: str) -> Optional[Booking]:
    """Cancel booking"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()

    if not db_booking:
        return None

    db_booking.status = BookingStatus.cancelled
    db_booking.cancellation_reason = cancellation_reason
    db_booking.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_booking)
    return db_booking


async def approve_booking(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Approve booking"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()

    if not db_booking:
        return None

    db_booking.status = BookingStatus.confirmed
    db_booking.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_booking)

    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()


async def decline_booking(db: AsyncSession, booking_id: int, decline_reason: str) -> Optional[Booking]:
    """Decline booking"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()

    if not db_booking:
        return None

    db_booking.status = BookingStatus.cancelled
    db_booking.cancellation_reason = decline_reason
    db_booking.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_booking)

    # Load relationships for response serialization
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.athlete),
            selectinload(Booking.class_obj).selectinload(Class.coach)
        )
    )
    return result.scalar_one()


# Individual Training Request Functions


async def create_individual_training_request(
    db: AsyncSession,
    athlete_id: int,
    request_data: IndividualTrainingRequestCreate
) -> IndividualTrainingRequest:
    """Create individual training request"""
    db_request = IndividualTrainingRequest(
        athlete_id=athlete_id,
        **request_data.model_dump()
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
            selectinload(IndividualTrainingRequest.coach)
        )
    )
    return result.scalar_one()


async def get_individual_training_request(db: AsyncSession, request_id: int) -> Optional[IndividualTrainingRequest]:
    """Get individual training request by ID"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
        )
    )
    return result.scalar_one_or_none()


async def get_individual_training_requests_by_athlete(db: AsyncSession, athlete_id: int) -> List[IndividualTrainingRequest]:
    """Get athlete's individual training requests"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.athlete_id == athlete_id)
        .options(
            selectinload(IndividualTrainingRequest.coach),
        )
        .order_by(IndividualTrainingRequest.requested_date.desc())
    )
    return result.scalars().all()


async def get_individual_training_requests_by_coach(db: AsyncSession, coach_id: int) -> List[IndividualTrainingRequest]:
    """Get individual training requests for coach"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.coach_id == coach_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
        )
        .order_by(IndividualTrainingRequest.requested_date.desc())
    )
    return result.scalars().all()


async def get_pending_individual_training_requests_by_coach(db: AsyncSession, coach_id: int) -> List[IndividualTrainingRequest]:
    """Get pending individual training requests for coach (max 10)"""
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(
            IndividualTrainingRequest.coach_id == coach_id,
            IndividualTrainingRequest.status == IndividualTrainingStatus.pending
        )
        .options(
            selectinload(IndividualTrainingRequest.athlete),
        )
        .order_by(IndividualTrainingRequest.requested_date.asc())
        .limit(10)
    )
    return result.scalars().all()


async def count_pending_individual_training_requests_by_athlete(db: AsyncSession, athlete_id: int) -> int:
    """Count pending individual training requests by athlete"""
    result = await db.execute(
        select(func.count(IndividualTrainingRequest.id))
        .where(
            IndividualTrainingRequest.athlete_id == athlete_id,
            IndividualTrainingRequest.status == IndividualTrainingStatus.pending
        )
    )
    return result.scalar()


async def accept_individual_training_request(
    db: AsyncSession,
    request_id: int,
    update_data: IndividualTrainingRequestUpdate
) -> Optional[IndividualTrainingRequest]:
    """Accept individual training request"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()

    if not db_request:
        return None

    # Update the request with scheduled details
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_request, field, value)

    db_request.status = IndividualTrainingStatus.accepted
    db_request.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_request)

    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
        )
    )
    return result.scalar_one()


async def decline_individual_training_request(db: AsyncSession, request_id: int, decline_reason: str) -> Optional[IndividualTrainingRequest]:
    """Decline individual training request"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()

    if not db_request:
        return None

    db_request.status = IndividualTrainingStatus.declined
    db_request.decline_reason = decline_reason
    db_request.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_request)

    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
        )
    )
    return result.scalar_one()


async def complete_individual_training_request(db: AsyncSession, request_id: int) -> Optional[IndividualTrainingRequest]:
    """Complete individual training"""
    result = await db.execute(select(IndividualTrainingRequest).where(IndividualTrainingRequest.id == request_id))
    db_request = result.scalar_one_or_none()

    if not db_request:
        return None

    db_request.status = IndividualTrainingStatus.completed
    db_request.updated_at = get_utc_now()

    await db.commit()
    await db.refresh(db_request)

    # Load relationships for response serialization
    result = await db.execute(
        select(IndividualTrainingRequest)
        .where(IndividualTrainingRequest.id == request_id)
        .options(
            selectinload(IndividualTrainingRequest.athlete),
            selectinload(IndividualTrainingRequest.coach),
        )
    )
    return result.scalar_one()
