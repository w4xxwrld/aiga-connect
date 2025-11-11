from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, computed_field
from typing import Optional, List
from datetime import date, datetime
from app.users.models import UserRole
from app.core.utils import validate_password_strength
import re


# Reusable validators
def validate_e164_phone(phone: str) -> str:
    """Validate phone number is in E.164 format"""
    pattern = r'^\+[1-9]\d{6,14}$'
    if not re.match(pattern, phone):
        raise ValueError("Phone number must be in E.164 format (e.g., +1234567890)")
    return phone


class UserBase(BaseModel):
    phone: str
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    email: Optional[EmailStr] = None
    birth_date: date
    primary_role: UserRole

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
       return validate_e164_phone(v)

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError("Birth date cannot be in the future")
        return v

    def get_age(self) -> int:
        """Calculate age in years"""
        today = date.today()
        age = today.year - self.birth_date.year
        if today.month < self.birth_date.month or (today.month == self.birth_date.month and today.day < self.birth_date.day):
            age -= 1
        return age

class UserCreate(UserBase):
    password: Optional[str] = None  # Optional for SMS-based auth

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password strength if provided"""
        if v:  # Only validate if password is provided
            is_valid, error_message = validate_password_strength(v)
            if not is_valid:
                raise ValueError(error_message)
        return v

    @field_validator("primary_role")
    @classmethod
    def validate_primary_role_age(cls, v, info):
        """Check age restrictions for coach role"""
        if hasattr(info, 'data') and info.data:
            birth_date = info.data.get('birth_date')
            if birth_date:
                today = date.today()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1

                if v == UserRole.coach and age < 16:
                    raise ValueError(f"Users under 16 cannot be coaches")
        return v

class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserSimple(UserBase):
    """Simplified user schema"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    phone: str
    password: Optional[str] = None  # Optional for SMS-based auth

class LoginResponse(BaseModel):
    """Response for login that requires OTP verification"""
    requires_otp: bool
    message: str
    phone_number: str

class SMSVerificationRequest(BaseModel):
    phone: str

class SMSVerificationConfirm(BaseModel):
    phone: str
    code: str

# JWT token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str  # Добавляем refresh токен
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    phone: Optional[str] = None
    role: Optional[str] = None


# OTP schemas
class SendOTPRequest(BaseModel):
    """Request schema for sending OTP"""
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        return validate_e164_phone(v)


class SendOTPResponse(BaseModel):
    """Response schema for OTP sending"""
    success: bool
    message: str
    phone_number: str


class VerifyOTPRequest(BaseModel):
    """Request schema for verifying OTP"""
    phone_number: str
    code: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        return validate_e164_phone(v)

    @field_validator("code")
    @classmethod
    def validate_code(cls, v):
        if not v or len(v) != 6 or not v.isdigit():
            raise ValueError("Code must be a 6-digit number")
        return v


class VerifyOTPResponse(BaseModel):
    """Response schema for OTP verification"""
    success: bool
    message: str
    phone_number: str