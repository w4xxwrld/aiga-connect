from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.bookings import schemas, crud

router = APIRouter()

@router.post("/", response_model=schemas.BookingOut)
async def create_booking(
    booking_data: schemas.BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать бронирование (родители для детей или взрослые спортсмены для себя)"""
    
    # Проверить роли пользователя
    user_roles = [ur.role for ur in current_user.user_roles]
    has_parent_role = UserRole.parent in user_roles
    has_athlete_role = UserRole.athlete in user_roles
    
    # Логика авторизации в зависимости от роли
    if has_parent_role:
        # Родители могут бронировать для своих детей
        # TODO: добавить проверку parent-athlete relationship
        new_booking = await crud.create_booking(db, booking_data, current_user.id)
    elif has_athlete_role:
        # Спортсмены могут бронировать только для себя
        if booking_data.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes can only book for themselves"
            )
        
        # Проверить возраст спортсмена
        from datetime import date
        today = date.today()
        athlete_age = today.year - current_user.birth_date.year
        if today.month < current_user.birth_date.month or (today.month == current_user.birth_date.month and today.day < current_user.birth_date.day):
            athlete_age -= 1
        
        if athlete_age < 16:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes under 16 can only be booked by their parents"
            )
        
        # Для взрослых спортсменов: booked_by_parent_id = None (они бронируют сами)
        new_booking = await crud.create_booking(db, booking_data, None)
    else:
        # Тренеры не могут создавать бронирования
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents and adult athletes can create bookings"
        )
    
    return new_booking

@router.get("/my-bookings", response_model=List[schemas.BookingOut])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои бронирования"""
    if current_user.role == UserRole.parent:
        bookings = await crud.get_bookings_by_parent(db, current_user.id)
    elif current_user.role == UserRole.athlete:
        bookings = await crud.get_bookings_by_athlete(db, current_user.id)
    else:  # coach
        bookings = await crud.get_bookings_by_coach(db, current_user.id)
    
    return bookings

@router.put("/{booking_id}/cancel", response_model=schemas.BookingOut)
async def cancel_booking(
    booking_id: int,
    cancellation_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отменить бронирование"""
    booking = await crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Проверить права на отмену
    if (current_user.role == UserRole.parent and booking.booked_by_parent_id != current_user.id) or \
       (current_user.role == UserRole.athlete and booking.athlete_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings"
        )
    
    cancelled_booking = await crud.cancel_booking(db, booking_id, cancellation_reason)
    return cancelled_booking

@router.get("/{booking_id}", response_model=schemas.BookingOut)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о бронировании"""
    booking = await crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Проверить права доступа
    if (current_user.role == UserRole.parent and booking.booked_by_parent_id != current_user.id) or \
       (current_user.role == UserRole.athlete and booking.athlete_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return booking
