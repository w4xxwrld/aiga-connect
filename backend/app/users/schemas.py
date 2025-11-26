from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, computed_field
from typing import Optional, List
from datetime import date, datetime
from app.users.models import UserRole, RoleStatus
from app.core.utils import validate_password_strength
import re


# Reusable validators
def validate_e164_phone(phone: str) -> str:
    """Validate phone number is in E.164 format"""
    pattern = r'^\+[1-9]\d{6,14}$'
    if not re.match(pattern, phone):
        raise ValueError("Phone number must be in E.164 format (e.g., +1234567890)")
    return phone


def validate_coach_age_requirement(birth_date: date, role: UserRole) -> None:
    """Validate that user is at least 16 years old if registering as coach"""
    if role == UserRole.coach:
        today = date.today()
        age = today.year - birth_date.year
        if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        if age < 16:
            raise ValueError("Users under 16 cannot register as coaches")


class LoginRequest(BaseModel):
    """Login with phone and password"""
    phone_number: str
    password: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        return validate_e164_phone(v)


class LoginResponse(BaseModel):
    """Response after successful login"""
    access_token: str
    refresh_token: str
    token_type: str
    role: UserRole
    role_status: Optional[RoleStatus] = None
    user: dict


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
                validate_coach_age_requirement(birth_date, v)
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
    requires_role_selection: bool = True
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    role: Optional[str] = None
    role_status: Optional[str] = None


class RegistrationData(BaseModel):
    """Temporary storage for registration data before OTP verification"""
    phone_number: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    password: str
    birth_date: date

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        return validate_e164_phone(v)

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError("Birth date cannot be in the future")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v


class SelectRoleRequest(RegistrationData):
    """Request schema for selecting role after OTP verification"""
    role: UserRole

    @field_validator("role")
    @classmethod
    def validate_coach_age(cls, v, info):
        """Check age restrictions for coach role"""
        if hasattr(info, 'data') and info.data:
            birth_date = info.data.get('birth_date')
            if birth_date:
                validate_coach_age_requirement(birth_date, v)
        return v


class SelectRoleResponse(BaseModel):
    """Response schema after selecting role"""
    access_token: str
    refresh_token: str
    token_type: str
    role: UserRole
    role_status: Optional[RoleStatus] = None
    message: Optional[str] = None


class ReviewCoachRequest(BaseModel):
    """Request schema for admin to review coach application"""
    user_id: int
    action: str  # "approve" or "decline"

    @field_validator("action")
    @classmethod
    def validate_action(cls, v):
        if v not in ["approve", "decline"]:
            raise ValueError("Action must be 'approve' or 'decline'")
        return v


class ReviewCoachResponse(BaseModel):
    """Response schema after reviewing coach application"""
    success: bool
    message: str
    user_id: int
    new_status: RoleStatus


class AdminActionResponse(BaseModel):
    """Generic response schema for admin actions"""
    success: bool
    message: str
    user: Optional[UserOut] = None


# Enhanced user management schemas
class UserListFilters(BaseModel):
    """Filters for listing users"""
    role: Optional[UserRole] = None
    role_status: Optional[RoleStatus] = None
    search: Optional[str] = None  # Search by name or phone
    include_deleted: bool = False
    skip: int = 0
    limit: int = 100

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v):
        if v > 500:
            raise ValueError("Limit cannot exceed 500")
        return v


class UserListResponse(BaseModel):
    """Response schema for listing users"""
    users: List[UserOut]
    total: int
    skip: int
    limit: int


class UserUpdate(BaseModel):
    """Schema for updating user details by admin"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    photo_url: Optional[str] = None

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v):
        if v and v > date.today():
            raise ValueError("Birth date cannot be in the future")
        return v


class ChangeRoleRequest(BaseModel):
    """Request schema for changing user's role"""
    new_role: UserRole

    @field_validator("new_role")
    @classmethod
    def validate_new_role(cls, v):
        # All roles are valid for this endpoint
        return v


# Enhanced coach management schemas
class CoachListFilters(BaseModel):
    """Filters for listing coaches"""
    role_status: Optional[RoleStatus] = None  # Filter by approval status
    search: Optional[str] = None  # Search by name or phone
    include_deleted: bool = False
    skip: int = 0
    limit: int = 100

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v):
        if v > 500:
            raise ValueError("Limit cannot exceed 500")
        return v


class CoachStats(BaseModel):
    """Coach performance statistics"""
    coach_id: int
    coach_name: str
    total_classes: int
    active_classes: int
    total_bookings: int
    total_students: int
    approval_status: Optional[RoleStatus] = None