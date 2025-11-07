from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.deps import get_db, get_current_user
from app.users import schemas
from app.users.models import User, UserRole
from app.users.service import UsersService
from app.users.twilio_service import TwilioService
from app.core.rate_limit import rate_limit_otp

router = APIRouter()


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (phone-based)"""
    service = UsersService(db)
    return await service.register_user(user)


@router.post("/login", response_model=schemas.Token)
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login with phone and password"""
    service = UsersService(db)
    return await service.login_user(login_data)


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_data: schemas.RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token"""
    service = UsersService(db)
    return await service.refresh_token(refresh_data.refresh_token)


@router.get("/me", response_model=schemas.UserOut)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=schemas.UserOut)
async def update_current_user(
    user_update: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    service = UsersService(db)
    return await service.update_user_profile(
        current_user.id, 
        user_update, 
        current_user.phone
    )


@router.get("/coaches", response_model=List[schemas.UserSimple])
async def get_all_coaches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of all coaches"""
    service = UsersService(db)
    return await service.get_coaches()


@router.get("/athletes", response_model=List[schemas.UserSimple])
async def get_all_athletes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of all athletes (coaches only)"""
    service = UsersService(db)
    return await service.get_athletes(current_user)


@router.post("/send-otp", response_model=schemas.SendOTPResponse)
async def send_otp(
    otp_request: schemas.SendOTPRequest,
    _: None = Depends(rate_limit_otp)
):
    """
    Send OTP code via SMS to the specified phone number.
    Rate limit: 3 requests per 10 minutes per IP address.
    """
    twilio_service = TwilioService()
    result = await twilio_service.send_otp(otp_request.phone_number)
    return result
