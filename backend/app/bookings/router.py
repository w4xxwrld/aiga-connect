from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.bookings import schemas, crud
from app.bookings.models import IndividualTrainingStatus

router = APIRouter()

@router.post("/", response_model=schemas.BookingOut)
async def create_booking(
    booking_data: schemas.BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать бронирование (родители для детей или взрослые спортсмены для себя)"""
    
    # Получить информацию о занятии для проверки возрастных ограничений
    from app.classes import crud as class_crud
    class_obj = await class_crud.get_class(db, booking_data.class_id)
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Получить информацию о спортсмене для проверки возраста
    from app.users import crud as user_crud
    athlete = await user_crud.get_user(db, booking_data.athlete_id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found"
        )
    
    # Проверить возраст спортсмена относительно возрастных ограничений занятия
    today = date.today()
    athlete_age = today.year - athlete.birth_date.year
    if today.month < athlete.birth_date.month or (today.month == athlete.birth_date.month and today.day < athlete.birth_date.day):
        athlete_age -= 1
    
    if class_obj.age_group_min and athlete_age < class_obj.age_group_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Athlete is too young for this class (min age: {class_obj.age_group_min})"
        )
    
    if class_obj.age_group_max and athlete_age > class_obj.age_group_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Athlete is too old for this class (max age: {class_obj.age_group_max})"
        )
    
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
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.parent in user_roles:
        bookings = await crud.get_bookings_by_parent(db, current_user.id)
    elif UserRole.athlete in user_roles:
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
    user_roles = [ur.role for ur in current_user.user_roles]
    if (UserRole.parent in user_roles and booking.booked_by_parent_id != current_user.id) or \
       (UserRole.athlete in user_roles and booking.athlete_id != current_user.id):
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
    user_roles = [ur.role for ur in current_user.user_roles]
    if (UserRole.parent in user_roles and booking.booked_by_parent_id != current_user.id) or \
       (UserRole.athlete in user_roles and booking.athlete_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return booking

@router.put("/{booking_id}/approve", response_model=schemas.BookingOut)
async def approve_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Подтвердить бронирование (только для тренеров)"""
    # Проверить, что пользователь является тренером
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can approve bookings"
        )
    
    booking = await crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Проверить, что тренер является тренером этого занятия
    from app.classes import crud as class_crud
    class_obj = await class_crud.get_class(db, booking.class_id)
    if not class_obj or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve bookings for your own classes"
        )
    
    approved_booking = await crud.approve_booking(db, booking_id)
    return approved_booking

@router.put("/{booking_id}/decline", response_model=schemas.BookingOut)
async def decline_booking(
    booking_id: int,
    decline_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отклонить бронирование (только для тренеров)"""
    # Проверить, что пользователь является тренером
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can decline bookings"
        )
    
    booking = await crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Проверить, что тренер является тренером этого занятия
    from app.classes import crud as class_crud
    class_obj = await class_crud.get_class(db, booking.class_id)
    if not class_obj or class_obj.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only decline bookings for your own classes"
        )
    
    declined_booking = await crud.decline_booking(db, booking_id, decline_reason)
    return declined_booking

# Individual Training Request endpoints
@router.post("/individual-training", response_model=schemas.IndividualTrainingRequestOut)
async def create_individual_training_request(
    request_data: schemas.IndividualTrainingRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать запрос на индивидуальную тренировку"""
    # Проверить роли пользователя
    user_roles = [ur.role for ur in current_user.user_roles]
    has_parent_role = UserRole.parent in user_roles
    has_athlete_role = UserRole.athlete in user_roles
    
    if not (has_parent_role or has_athlete_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents and athletes can request individual training"
        )
    
    # Проверить, что запрашиваемый тренер существует и является тренером
    from app.users import crud as user_crud
    coach = await user_crud.get_user(db, request_data.coach_id)
    if not coach or not await user_crud.user_has_role(db, coach.id, UserRole.coach):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    # Проверить лимит запросов для тренера (максимум 10 ожидающих)
    pending_count = await crud.count_pending_individual_training_requests_by_coach(db, request_data.coach_id)
    if pending_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coach has reached the maximum number of pending requests (10)"
        )
    
    # Логика авторизации в зависимости от роли
    if has_parent_role:
        # Родители могут запрашивать для своих детей
        # TODO: добавить проверку parent-athlete relationship
        new_request = await crud.create_individual_training_request(db, request_data, current_user.id)
    elif has_athlete_role:
        # Спортсмены могут запрашивать только для себя
        if request_data.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes can only request individual training for themselves"
            )
        
        # Для взрослых спортсменов: requested_by_parent_id = None
        new_request = await crud.create_individual_training_request(db, request_data, None)
    
    return new_request

@router.get("/individual-training/my-requests", response_model=List[schemas.IndividualTrainingRequestOut])
async def get_my_individual_training_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои запросы на индивидуальные тренировки"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.parent in user_roles:
        requests = await crud.get_individual_training_requests_by_athlete(db, current_user.id)
    elif UserRole.athlete in user_roles:
        requests = await crud.get_individual_training_requests_by_athlete(db, current_user.id)
    else:  # coach
        requests = await crud.get_individual_training_requests_by_coach(db, current_user.id)
    
    return requests

@router.get("/individual-training/pending", response_model=List[schemas.IndividualTrainingRequestOut])
async def get_pending_individual_training_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить ожидающие запросы на индивидуальные тренировки (только для тренеров)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can view pending individual training requests"
        )
    
    requests = await crud.get_pending_individual_training_requests_by_coach(db, current_user.id)
    return requests

@router.get("/individual-training/{request_id}", response_model=schemas.IndividualTrainingRequestOut)
async def get_individual_training_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о запросе на индивидуальную тренировку"""
    request = await crud.get_individual_training_request(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Individual training request not found"
        )
    
    # Проверить права доступа
    user_roles = [ur.role for ur in current_user.user_roles]
    if (UserRole.parent in user_roles and request.requested_by_parent_id != current_user.id) or \
       (UserRole.athlete in user_roles and request.athlete_id != current_user.id) or \
       (UserRole.coach in user_roles and request.coach_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return request

@router.put("/individual-training/{request_id}/accept", response_model=schemas.IndividualTrainingRequestOut)
async def accept_individual_training_request(
    request_id: int,
    update_data: schemas.IndividualTrainingRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Принять запрос на индивидуальную тренировку (только для тренеров)"""
    # Проверить, что пользователь является тренером
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can accept individual training requests"
        )
    
    request = await crud.get_individual_training_request(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Individual training request not found"
        )
    
    # Проверить, что тренер является тренером этого запроса
    if request.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only accept requests for your own individual training"
        )
    
    # Проверить, что запрос в статусе pending
    if request.status != IndividualTrainingStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only accept pending requests"
        )
    
    accepted_request = await crud.accept_individual_training_request(db, request_id, update_data)
    return accepted_request

@router.put("/individual-training/{request_id}/decline", response_model=schemas.IndividualTrainingRequestOut)
async def decline_individual_training_request(
    request_id: int,
    decline_reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отклонить запрос на индивидуальную тренировку (только для тренеров)"""
    # Проверить, что пользователь является тренером
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can decline individual training requests"
        )
    
    request = await crud.get_individual_training_request(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Individual training request not found"
        )
    
    # Проверить, что тренер является тренером этого запроса
    if request.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only decline requests for your own individual training"
        )
    
    # Проверить, что запрос в статусе pending
    if request.status != IndividualTrainingStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only decline pending requests"
        )
    
    declined_request = await crud.decline_individual_training_request(db, request_id, decline_reason)
    return declined_request

@router.put("/individual-training/{request_id}/complete", response_model=schemas.IndividualTrainingRequestOut)
async def complete_individual_training_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Завершить индивидуальную тренировку (только для тренеров)"""
    # Проверить, что пользователь является тренером
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can complete individual training"
        )
    
    request = await crud.get_individual_training_request(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Individual training request not found"
        )
    
    # Проверить, что тренер является тренером этого запроса
    if request.coach_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own individual training"
        )
    
    # Проверить, что запрос в статусе accepted
    if request.status != IndividualTrainingStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only complete accepted requests"
        )
    
    completed_request = await crud.complete_individual_training_request(db, request_id)
    return completed_request
