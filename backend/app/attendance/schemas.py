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


class AthleteBasic(BaseModel):
    """Basic athlete info for attendance response"""
    id: int
    first_name: str
    last_name: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


class AttendanceOut(AttendanceBase):
    id: int
    marked_at: datetime
    created_at: datetime
    athlete: Optional[AthleteBasic] = None

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


# ============================================================================
# ADMIN SCHEMAS
# ============================================================================

class AthleteSimple(BaseModel):
    """Simple athlete info for attendance list."""
    id: int
    first_name: str
    last_name: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


class CoachSimple(BaseModel):
    """Simple coach info for class in attendance."""
    id: int
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class ClassSimple(BaseModel):
    """Simple class info for attendance list."""
    id: int
    name: str
    start_time: str
    coach: Optional[CoachSimple] = None

    model_config = ConfigDict(from_attributes=True)


class AdminAttendanceOut(BaseModel):
    """Attendance record with full athlete and class info for admin."""
    id: int
    athlete_id: int
    class_id: int
    qr_code: str
    attendance_date: date
    marked_at: datetime
    created_at: datetime
    athlete: Optional[AthleteSimple] = None
    class_obj: Optional[ClassSimple] = None

    model_config = ConfigDict(from_attributes=True)


class AdminAttendanceListResponse(BaseModel):
    """Paginated attendance list response for admin."""
    attendances: list[AdminAttendanceOut]
    total: int


class AdminAttendanceStats(BaseModel):
    """Overall attendance statistics for admin dashboard."""
    total_attendances: int
    unique_athletes: int
    unique_classes: int
    today_count: int
