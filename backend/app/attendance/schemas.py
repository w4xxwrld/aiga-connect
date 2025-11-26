from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime
from app.config import settings


class AttendanceBase(BaseModel):
    athlete_id: int
    class_id: int
    qr_code: str
    attendance_date: date

    @field_validator("qr_code")
    @classmethod
    def validate_qr_code(cls, v):
        if not v or not v.strip():
            raise ValueError("QR code cannot be empty")
        if v != settings.ATTENDANCE_QR_CODE:
            raise ValueError("Invalid QR code")
        return v


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceOut(AttendanceBase):
    id: int
    marked_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MarkAttendanceRequest(BaseModel):
    class_id: int
    qr_code: str
    timezone: str  # IANA timezone string (e.g., "Asia/Almaty", "America/New_York")

    @field_validator("qr_code")
    @classmethod
    def validate_qr_code(cls, v):
        if not v or not v.strip():
            raise ValueError("QR code cannot be empty")
        if v != settings.ATTENDANCE_QR_CODE:
            raise ValueError("Invalid QR code")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v):
        if not v or not v.strip():
            raise ValueError("Timezone cannot be empty")
        # Basic validation - will be validated more thoroughly in the service layer
        return v


class AvailableClassForAttendance(BaseModel):
    """Schema for classes available for attendance marking."""
    class_id: int
    class_name: str
    start_time: str  # Time as string (HH:MM:SS)
    end_time: str  # Time as string (HH:MM:SS)
    minutes_remaining: int  # Minutes until attendance window closes
    booking_id: int  # User's booking ID for this class

    model_config = ConfigDict(from_attributes=True)
