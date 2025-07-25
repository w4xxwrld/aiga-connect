from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.bookings.models import BookingStatus, BookingType

class BookingBase(BaseModel):
    athlete_id: int
    class_id: int
    booking_type: BookingType = BookingType.regular
    class_date: datetime
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    is_paid: Optional[bool] = None
    payment_amount: Optional[int] = None

class BookingOut(BookingBase):
    id: int
    booked_by_parent_id: Optional[int] = None  # Nullable для взрослых спортсменов
    status: BookingStatus
    booking_date: datetime
    is_paid: bool
    payment_amount: Optional[int] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Специальная схема для отображения с деталями
class BookingWithDetails(BookingOut):
    athlete_name: str
    class_name: str
    coach_name: str
    parent_name: str
