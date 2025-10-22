from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.deps import get_db, get_current_user
from app.users import schemas, crud
from app.users.models import User, UserRole
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token

router = APIRouter()


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (phone-based)"""
    # Check if phone already registered
    existing_user = await crud.get_user_by_phone(db, user.phone)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    db_user = await crud.create_user(db, user)
    return db_user


@router.post("/login", response_model=schemas.Token)
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login with phone and password"""
    user = await crud.authenticate_user(db, login_data.phone, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    # Create JWT tokens with user info
    token_data = {
        "sub": user.phone,
        "role": user.primary_role.value,
        "user_id": user.id
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_data: schemas.RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token"""
    payload = decode_refresh_token(refresh_data.refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Check for errors
    if "error" in payload:
        if payload["error"] == "token_expired":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired. Please login again.",
                headers={"X-Token-Expired": "true"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

    # Verify user still exists
    user = await crud.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Create new tokens with current user data
    token_data = {
        "sub": user.phone,
        "role": user.primary_role.value,
        "user_id": user.id
    }
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


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
    # Prevent changing phone to one that's already taken
    if user_update.phone != current_user.phone:
        existing = await crud.get_user_by_phone(db, user_update.phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use"
            )

    updated_user = await crud.update_user(db, current_user.id, user_update)
    return updated_user


@router.get("/coaches", response_model=List[schemas.UserSimple])
async def get_all_coaches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of all coaches"""
    coaches = await crud.get_all_coaches(db)
    return coaches


@router.get("/athletes", response_model=List[schemas.UserSimple])
async def get_all_athletes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of all athletes (coaches only)"""
    if current_user.primary_role != UserRole.coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can view athlete list"
        )

    athletes = await crud.get_all_athletes(db)
    return athletes


# TODO: Implement Twilio SMS verification endpoints
# @router.post("/send-sms")
# async def send_sms_verification(request: schemas.SMSVerificationRequest):
#     """Send SMS verification code via Twilio"""
#     pass
#
# @router.post("/verify-sms")
# async def verify_sms_code(request: schemas.SMSVerificationConfirm):
#     """Verify SMS code and create/login user"""
#     pass
