from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.bookings.models import BookingStatus, BookingType, IndividualTrainingStatus

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

# User schemas for related objects
class UserSimple(BaseModel):
    id: int
    full_name: str
    
    model_config = ConfigDict(from_attributes=True)

# Class schema for related object
class ClassSimple(BaseModel):
    id: int
    name: str
    coach: Optional[UserSimple] = None
    
    model_config = ConfigDict(from_attributes=True)

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
    
    # Related objects
    athlete: Optional[UserSimple] = None
    class_obj: Optional[ClassSimple] = None
    booked_by_parent: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)

# Individual Training Request Schemas
class IndividualTrainingRequestBase(BaseModel):
    coach_id: int
    requested_date: datetime
    preferred_time_start: Optional[str] = None
    preferred_time_end: Optional[str] = None
    athlete_notes: Optional[str] = None

    @field_validator("preferred_time_start", "preferred_time_end")
    @classmethod
    def validate_time_format(cls, v):
        if v is not None:
            try:
                # Validate HH:MM format
                if len(v) != 5 or v[2] != ':':
                    raise ValueError("Time must be in HH:MM format")
                hour, minute = v.split(':')
                if not (0 <= int(hour) <= 23 and 0 <= int(minute) <= 59):
                    raise ValueError("Invalid time values")
            except ValueError as e:
                raise ValueError(f"Invalid time format: {e}")
        return v

class IndividualTrainingRequestCreate(IndividualTrainingRequestBase):
    pass

class IndividualTrainingRequestUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    scheduled_time_start: Optional[str] = None
    scheduled_time_end: Optional[str] = None
    coach_notes: Optional[str] = None
    payment_amount: Optional[int] = None
    is_paid: Optional[bool] = None

class IndividualTrainingRequestOut(IndividualTrainingRequestBase):
    id: int
    athlete_id: int
    requested_by_parent_id: Optional[int] = None
    status: IndividualTrainingStatus
    request_date: datetime
    scheduled_date: Optional[datetime] = None
    scheduled_time_start: Optional[str] = None
    scheduled_time_end: Optional[str] = None
    is_paid: bool
    payment_amount: Optional[int] = None
    athlete_notes: Optional[str] = None
    coach_notes: Optional[str] = None
    decline_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related objects
    athlete: Optional[UserSimple] = None
    coach: Optional[UserSimple] = None
    requested_by_parent: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)

# Специальная схема для отображения с деталями
class BookingWithDetails(BookingOut):
    athlete_name: str
    class_name: str
    coach_name: str
    parent_name: str
