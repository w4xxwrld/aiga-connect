from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, time
from app.classes.models import DifficultyLevel


class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty_level: DifficultyLevel = DifficultyLevel.beginner
    coach_id: int
    days_of_week: List[str]  # Array of days like ["monday", "wednesday", "friday"]
    start_time: time
    end_time: time
    max_capacity: int = 20
    price: int  # Price in tenge

    @field_validator("days_of_week")
    @classmethod
    def validate_days_of_week(cls, v):
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        if not v or len(v) == 0:
            raise ValueError("At least one day of week is required")

        for day in v:
            if day.lower() not in valid_days:
                raise ValueError(f"Invalid day: {day}. Valid days: {', '.join(valid_days)}")

        # Return lowercase normalized days
        return [day.lower() for day in v]

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price must be positive")
        return v


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    days_of_week: Optional[List[str]] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_capacity: Optional[int] = None
    price: Optional[int] = None

    @field_validator("days_of_week")
    @classmethod
    def validate_days_of_week(cls, v):
        if v is None:
            return v

        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        if len(v) == 0:
            raise ValueError("At least one day of week is required")

        for day in v:
            if day.lower() not in valid_days:
                raise ValueError(f"Invalid day: {day}. Valid days: {', '.join(valid_days)}")

        return [day.lower() for day in v]


class CoachOut(BaseModel):
    id: int
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class ClassOut(ClassBase):
    id: int
    created_at: datetime
    updated_at: datetime
    coach: Optional[CoachOut] = None

    model_config = ConfigDict(from_attributes=True)


class ClassParticipantOut(BaseModel):
    """Athlete who booked a class"""
    id: int
    first_name: str
    last_name: str
    phone: str
    booking_status: str
    class_date: datetime
    is_paid: bool
    payment_amount: Optional[float] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
