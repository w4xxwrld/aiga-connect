from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.deps import get_db, get_current_user
from app.users import schemas
from app.users.models import User
from app.users.service import UsersService
from app.users.twilio_service import TwilioService
from app.core.rate_limit import rate_limit_otp

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=schemas.RegistrationData)
async def validate_registration(
    registration_data: schemas.RegistrationData,
    db: AsyncSession = Depends(get_db),
):
    """
    Validate registration data before sending OTP.
    Does NOT create user - user is created after OTP verification and role selection.
    Checks if phone number is already registered.
    """
    service = UsersService(db)
    return await service.validate_registration(registration_data)


@router.post("/login", response_model=schemas.LoginResponse)
async def login(
    login_data: schemas.LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login existing user with phone number and password.
    Returns JWT tokens.
    """
    service = UsersService(db)
    return await service.login(login_data)


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


@router.put("/me/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Upload or update profile photo.

    - **Allowed formats**: JPEG, PNG, WebP
    - **Max size**: 5MB
    - **Returns**: Photo URL
    """
    service = UsersService(db)
    photo_url = await service.upload_profile_photo(current_user.id, file)
    return {
        "photo_url": photo_url,
        "message": "Photo uploaded successfully"
    }


@router.delete("/me/photo")
async def delete_profile_photo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Delete profile photo.
    """
    service = UsersService(db)
    await service.delete_profile_photo(current_user.id)
    return {
        "message": "Photo deleted successfully"
    }


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
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit_otp)
):
    """
    Verify OTP code.
    For new users: returns requires_role_selection=True
    For existing users: returns tokens and user info
    Rate limit: 3 requests per 10 minutes per IP address.
    """
    from app.users import crud
    from app.core.security import create_access_token, create_refresh_token
    
    twilio_service = TwilioService()
    verification_result = await twilio_service.verify_otp(
        verify_request.phone_number,
        verify_request.code
    )
    
    if not verification_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP verification failed"
        )
    
    # Check if user exists
    existing_user = await crud.get_user_by_phone(db, verify_request.phone_number)
    
    if existing_user:
        # Existing user - return tokens
        token_data = {
            "sub": existing_user.phone,
            "role": existing_user.primary_role.value,
            "user_id": existing_user.id
        }
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        return schemas.VerifyOTPResponse(
            success=True,
            message="Login successful",
            phone_number=verify_request.phone_number,
            requires_role_selection=False,
            access_token=access_token,
            refresh_token=refresh_token,
            role=existing_user.primary_role.value,
            role_status=existing_user.role_status.value if existing_user.role_status else None
        )
    
    # New user - requires role selection
    return schemas.VerifyOTPResponse(
        success=True,
        message="OTP verified successfully. Please select your role.",
        phone_number=verify_request.phone_number,
        requires_role_selection=True
    )


@router.post("/select-role", response_model=schemas.SelectRoleResponse)
async def select_role(
    role_data: schemas.SelectRoleRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Select role and create user account after OTP verification.
    This endpoint should be called after /verify-otp succeeds.
    Creates user with all registration data and selected role.
    Coach role requires approval and sets status to pending.
    """
    service = UsersService(db)
    return await service.select_role(role_data)


@router.get("/admin/pending-coaches", response_model=List[schemas.UserSimple])
async def get_pending_coaches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to get all coaches with pending status.
    Only administrators can access this endpoint.
    """
    service = UsersService(db)
    return await service.get_pending_coaches(current_user)


@router.post("/admin/review-coach", response_model=schemas.ReviewCoachResponse)
async def review_coach(
    review_request: schemas.ReviewCoachRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to approve or decline coach applications.
    Only administrators can access this endpoint.
    """
    service = UsersService(db)
    return await service.review_coach(current_user, review_request)

