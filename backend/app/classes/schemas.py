from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, time
from app.classes.models import DifficultyLevel, ClassStatus

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty_level: DifficultyLevel = DifficultyLevel.beginner
    coach_id: int
    day_of_week: str
    start_time: time
    end_time: time
    age_group_min: Optional[int] = None
    age_group_max: Optional[int] = None
    max_capacity: int = 20
    price_per_class: int  # цена в тенге
    is_trial_available: bool = True

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week(cls, v):
        valid_days = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]
        if v.lower() not in valid_days:
            raise ValueError("День недели должен быть одним из: " + ", ".join(valid_days))
        return v.lower()

    @field_validator("price_per_class")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Цена должна быть положительной")
        return v

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    day_of_week: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    age_group_min: Optional[int] = None
    age_group_max: Optional[int] = None
    max_capacity: Optional[int] = None
    price_per_class: Optional[int] = None
    is_trial_available: Optional[bool] = None
    status: Optional[ClassStatus] = None

class CoachOut(BaseModel):
    id: int
    full_name: str

    model_config = ConfigDict(from_attributes=True)

class ClassOut(ClassBase):
    id: int
    status: ClassStatus
    created_at: datetime
    updated_at: datetime
    coach: Optional[CoachOut] = None

    model_config = ConfigDict(from_attributes=True)

class ClassParticipantOut(BaseModel):
    id: int
    full_name: str
    birth_date: datetime
    booking_type: str
    booking_status: str
    class_date: datetime
    is_paid: bool
    payment_amount: Optional[int] = None
    notes: Optional[str] = None
    booked_by_parent: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
