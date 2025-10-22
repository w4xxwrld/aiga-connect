from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime


class AttendanceBase(BaseModel):
    athlete_id: int
    class_id: int
    qr_code: str
    attendance_date: date
    method: str = "qr_scan"  # qr_scan or manual_entry

    @field_validator("qr_code")
    @classmethod
    def validate_qr_code(cls, v):
        if len(v) != 3 or not v.isdigit():
            raise ValueError("QR code must be exactly 3 digits")
        return v

    @field_validator("method")
    @classmethod
    def validate_method(cls, v):
        if v not in ["qr_scan", "manual_entry"]:
            raise ValueError("Method must be 'qr_scan' or 'manual_entry'")
        return v


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceOut(AttendanceBase):
    id: int
    marked_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateQRCodeRequest(BaseModel):
    class_id: int


class GenerateQRCodeResponse(BaseModel):
    qr_code: str
    class_id: int
    expires_at: datetime


class MarkAttendanceRequest(BaseModel):
    class_id: int
    qr_code: str
    method: str = "qr_scan"

    @field_validator("qr_code")
    @classmethod
    def validate_qr_code(cls, v):
        if len(v) != 3 or not v.isdigit():
            raise ValueError("QR code must be exactly 3 digits")
        return v
