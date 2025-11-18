from pydantic import BaseModel, ConfigDict, field_validator, UUID4, Field
from typing import Optional
from datetime import datetime

from app.bookings.models import BookingStatus, IndividualTrainingStatus


class BookingBase(BaseModel):
    athlete_id: int
    class_id: int
    class_date: datetime
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    is_paid: Optional[bool] = None
    payment_amount: Optional[float] = None


# User schemas for related objects
class UserSimple(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


# Class schema for related object
class ClassSimple(BaseModel):
    id: int
    name: str
    coach: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)


class BookingOut(BookingBase):
    id: int
    status: BookingStatus
    booking_date: datetime
    is_paid: bool
    payment_amount: Optional[float] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Payment information
    payment_required: bool = Field(default=False, description="Whether payment is required")
    payment_status: Optional[str] = Field(None, description="Payment status (pending, completed, failed, not_required)")
    payment_url: Optional[str] = Field(None, description="Stripe Checkout URL for payment")
    amount: Optional[int] = Field(None, description="Payment amount in tenge")
    currency: Optional[str] = Field(default="kzt", description="Currency code")

    # Related objects
    athlete: Optional[UserSimple] = None
    class_obj: Optional[ClassSimple] = None

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
    payment_amount: Optional[float] = None
    is_paid: Optional[bool] = None


class IndividualTrainingRequestOut(IndividualTrainingRequestBase):
    id: int
    athlete_id: int
    status: IndividualTrainingStatus
    request_date: datetime
    scheduled_date: Optional[datetime] = None
    scheduled_time_start: Optional[str] = None
    scheduled_time_end: Optional[str] = None
    is_paid: bool
    payment_amount: Optional[float] = None
    athlete_notes: Optional[str] = None
    coach_notes: Optional[str] = None
    decline_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Related objects
    athlete: Optional[UserSimple] = None
    coach: Optional[UserSimple] = None

    model_config = ConfigDict(from_attributes=True)


class BookingResponse(BaseModel):
    """Enhanced booking response with payment information"""
    id: UUID4
    user_id: UUID4
    training_id: UUID4
    
    # Booking status
    status: str = Field(..., description="Booking status (confirmed, pending, cancelled)")
    
    # Payment information
    payment_required: bool = Field(..., description="Whether payment is required")
    is_paid: bool = Field(default=False, description="Whether payment is completed")
    payment_status: Optional[str] = Field(None, description="Payment status (pending, completed, failed, not_required)")
    payment_url: Optional[str] = Field(None, description="Stripe Checkout URL for payment")
    payment_id: Optional[UUID4] = Field(None, description="Associated payment ID")
    amount: Optional[int] = Field(None, description="Payment amount in cents")
    currency: Optional[str] = Field(default="usd", description="Currency code")
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime] = None
    
    # Related entities (optional)
    training: Optional["TrainingInBooking"] = None
    payment: Optional["PaymentInBooking"] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "uuid",
                "training_id": "uuid",
                "status": "confirmed",
                "payment_required": True,
                "is_paid": False,
                "payment_status": "pending",
                "payment_url": "https://checkout.stripe.com/pay/cs_test_xxxxx",
                "amount": 2000,
                "currency": "usd",
                "created_at": "2025-10-28T12:00:00Z"
            }
        }


class PaymentInBooking(BaseModel):
    """Payment details in booking response"""
    id: UUID4
    status: str
    amount: int
    currency: str
    paid_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TrainingInBooking(BaseModel):
    """Training details in booking response"""
    id: UUID4
    name: str
    description: Optional[str]
    price: int
    currency: str
    date: Optional[datetime]
    
    class Config:
        from_attributes = True
