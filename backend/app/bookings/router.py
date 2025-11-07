from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.bookings import schemas
from app.bookings.service import BookingsService

router = APIRouter()

@router.post("/", response_model=schemas.BookingOut)
async def create_booking(
    booking_data: schemas.BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать бронирование (только спортсмены для себя)"""
    service = BookingsService(db)
    return await service.create_booking(booking_data, current_user)

@router.get("/my-bookings", response_model=List[schemas.BookingOut])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои бронирования"""
    service = BookingsService(db)
    return await service.get_my_bookings(current_user)

@router.put("/{booking_id}/cancel", response_model=schemas.BookingOut)
async def cancel_booking(
    booking_id: int,
    cancellation_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отменить бронирование"""
    service = BookingsService(db)
    return await service.cancel_booking(booking_id, cancellation_reason, current_user)

@router.get("/{booking_id}", response_model=schemas.BookingOut)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о бронировании"""
    service = BookingsService(db)
    return await service.get_booking(booking_id, current_user)

@router.put("/{booking_id}/approve", response_model=schemas.BookingOut)
async def approve_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Подтвердить бронирование (только для тренеров)"""
    service = BookingsService(db)
    return await service.approve_booking(booking_id, current_user)
   
@router.put("/{booking_id}/decline", response_model=schemas.BookingOut)
async def decline_booking(
    booking_id: int,
    decline_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отклонить бронирование (только для тренеров)"""
    service = BookingsService(db)
    return await service.decline_booking(booking_id, decline_reason, current_user)

# Individual Training Request endpoints
@router.post("/individual-training", response_model=schemas.IndividualTrainingRequestOut)
async def create_individual_training_request(
    request_data: schemas.IndividualTrainingRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать запрос на индивидуальную тренировку"""
    service = BookingsService(db)
    return await service.create_individual_training_request(request_data, current_user)

@router.get("/individual-training/my-requests", response_model=List[schemas.IndividualTrainingRequestOut])
async def get_my_individual_training_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои запросы на индивидуальные тренировки"""
    service = BookingsService(db)
    return await service.get_my_individual_training_requests(current_user)

@router.get("/individual-training/pending", response_model=List[schemas.IndividualTrainingRequestOut])
async def get_pending_individual_training_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить ожидающие запросы на индивидуальные тренировки (только для тренеров)"""
    service = BookingsService(db)
    return await service.get_pending_individual_training_requests(current_user)

@router.get("/individual-training/{request_id}", response_model=schemas.IndividualTrainingRequestOut)
async def get_individual_training_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о запросе на индивидуальную тренировку"""
    service = BookingsService(db)
    return await service.get_individual_training_request(request_id, current_user)

@router.put("/individual-training/{request_id}/accept", response_model=schemas.IndividualTrainingRequestOut)
async def accept_individual_training_request(
    request_id: int,
    update_data: schemas.IndividualTrainingRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Принять запрос на индивидуальную тренировку (только для тренеров)"""
    service = BookingsService(db)
    return await service.accept_individual_training_request(request_id, update_data, current_user)

@router.put("/individual-training/{request_id}/decline", response_model=schemas.IndividualTrainingRequestOut)
async def decline_individual_training_request(
    request_id: int,
    decline_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отклонить запрос на индивидуальную тренировку (только для тренеров)"""
    service = BookingsService(db)
    return await service.decline_individual_training_request(request_id, decline_reason, current_user)

@router.put("/individual-training/{request_id}/complete", response_model=schemas.IndividualTrainingRequestOut)
async def complete_individual_training_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Завершить индивидуальную тренировку (только для тренеров)"""
    service = BookingsService(db)
    return await service.complete_individual_training_request(request_id, current_user)
