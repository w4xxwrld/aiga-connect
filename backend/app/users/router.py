from fastapi import APIRouter, Depends, HTTPException, status
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
    """
    Register a new user - creates account but DOES NOT authenticate.
    User must verify OTP to get authenticated.
    All fields are required.
    """
    service = UsersService(db)
    return await service.register_user(user)


@router.post("/validate-login", response_model=schemas.LoginResponse)
async def validate_login(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Validate phone and password WITHOUT issuing tokens.
    Used before sending OTP to ensure credentials are correct.
    Returns success message if credentials are valid.
    """
    service = UsersService(db)
    user = await service.validate_login_credentials(login_data)
    
    return schemas.LoginResponse(
        requires_otp=True,
        message="Credentials validated. Please verify OTP to complete login.",
        phone_number=user.phone
    )


@router.post(
    "/login", 
    response_model=schemas.Token,
    deprecated=True,
    description="⚠️ DEPRECATED: This endpoint is deprecated and will be removed in a future version. Use /validate-login followed by OTP verification instead."
)
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    DEPRECATED: Use /validate-login + OTP verification instead.
    This endpoint still exists for backward compatibility but should not be used.
    It bypasses OTP verification which is a security risk.
    
    Recommended flow:
    1. POST /validate-login (validates credentials)
    2. POST /send-otp (sends OTP code)
    3. POST /verify-otp-and-login (verifies OTP and returns tokens)
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ DEPRECATED ENDPOINT USED: /login by phone {login_data.phone}")
    
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


@router.post("/verify-otp", response_model=schemas.VerifyOTPResponse)
async def verify_otp(
    verify_request: schemas.VerifyOTPRequest,
    _: None = Depends(rate_limit_otp)
):
    """
    Verify OTP code for the specified phone number.
    Rate limit: 3 requests per 10 minutes per IP address.
    """
    twilio_service = TwilioService()
    result = await twilio_service.verify_otp(
        verify_request.phone_number,
        verify_request.code
    )
    return result


@router.post("/verify-otp-and-login", response_model=schemas.Token)
async def verify_otp_and_login(
    verify_request: schemas.VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit_otp)
):
    """
    Verify OTP code and authenticate user (create account if doesn't exist).
    This endpoint will ONLY authenticate if the OTP is valid.
    Rate limit: 3 requests per 10 minutes per IP address.
    """
    # Step 1: Verify OTP with Twilio - this will raise HTTPException if invalid
    twilio_service = TwilioService()
    verification_result = await twilio_service.verify_otp(
        verify_request.phone_number,
        verify_request.code
    )
    
    # Step 2: Only proceed if OTP verification was successful
    if not verification_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP verification failed"
        )
    
    # Step 3: OTP is verified - now authenticate user
    service = UsersService(db)
    return await service.authenticate_with_otp(verify_request.phone_number)
