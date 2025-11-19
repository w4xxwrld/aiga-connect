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


# ============================================================================
# ADMIN ACCOUNT MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/admin/create-first-admin", response_model=schemas.AdminActionResponse)
async def create_first_admin(
    admin_request: schemas.CreateFirstAdminRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create the first admin user using a secret key.
    This endpoint can only be used once when there are no admins in the system.
    Requires ADMIN_SECRET_KEY from environment variables.
    """
    service = UsersService(db)
    return await service.create_first_admin(admin_request)


@router.post("/admin/promote-user", response_model=schemas.AdminActionResponse)
async def promote_user_to_admin(
    promote_request: schemas.PromoteUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Promote an existing user to admin role.
    Only administrators can promote users.
    """
    service = UsersService(db)
    return await service.promote_user_to_admin(current_user, promote_request)


@router.post("/admin/demote-admin", response_model=schemas.AdminActionResponse)
async def demote_admin(
    demote_request: schemas.DemoteAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Demote an admin back to athlete or coach role.
    Only administrators can demote admins.
    """
    service = UsersService(db)
    return await service.demote_admin(current_user, demote_request)


# ============================================================================
# ENHANCED USER MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/admin/users", response_model=schemas.UserListResponse)
async def list_all_users(
    role: str = None,
    role_status: str = None,
    search: str = None,
    include_deleted: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all users with filtering options (admin only).

    Query parameters:
    - **role**: Filter by role (athlete, coach, admin)
    - **role_status**: Filter by role status (pending, approved, declined)
    - **search**: Search by name, phone, or email
    - **include_deleted**: Include soft-deleted users
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return (max 500)
    """
    from app.users.models import UserRole, RoleStatus

    # Convert string parameters to enums if provided
    role_enum = UserRole(role) if role else None
    role_status_enum = RoleStatus(role_status) if role_status else None

    filters = schemas.UserListFilters(
        role=role_enum,
        role_status=role_status_enum,
        search=search,
        include_deleted=include_deleted,
        skip=skip,
        limit=limit
    )

    service = UsersService(db)
    return await service.list_users(current_user, filters)


@router.get("/admin/users/{user_id}", response_model=schemas.UserOut)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific user (admin only).
    """
    service = UsersService(db)
    return await service.get_user_by_id_admin(current_user, user_id)


@router.put("/admin/users/{user_id}", response_model=schemas.AdminActionResponse)
async def update_user(
    user_id: int,
    update_data: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update any user's profile information (admin only).
    """
    service = UsersService(db)
    return await service.update_user_by_admin(current_user, user_id, update_data)


@router.delete("/admin/users/{user_id}", response_model=schemas.AdminActionResponse)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a user account (admin only).
    User data is preserved but marked as deleted.
    """
    service = UsersService(db)
    return await service.soft_delete_user(current_user, user_id)


@router.post("/admin/users/{user_id}/restore", response_model=schemas.AdminActionResponse)
async def restore_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Restore a soft-deleted user account (admin only).
    """
    service = UsersService(db)
    return await service.restore_user(current_user, user_id)


@router.put("/admin/users/{user_id}/role", response_model=schemas.AdminActionResponse)
async def change_user_role(
    user_id: int,
    role_request: schemas.ChangeRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change a user's role (admin only).
    """
    service = UsersService(db)
    return await service.change_user_role(current_user, user_id, role_request)


# ============================================================================
# ENHANCED COACH MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/admin/coaches", response_model=schemas.UserListResponse)
async def list_all_coaches_admin(
    role_status: str = None,
    search: str = None,
    include_deleted: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all coaches with filtering options (admin only).

    Query parameters:
    - **role_status**: Filter by approval status (pending, approved, declined)
    - **search**: Search by name or phone
    - **include_deleted**: Include suspended coaches
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return (max 500)
    """
    from app.users.models import RoleStatus

    # Convert string parameter to enum if provided
    role_status_enum = RoleStatus(role_status) if role_status else None

    filters = schemas.CoachListFilters(
        role_status=role_status_enum,
        search=search,
        include_deleted=include_deleted,
        skip=skip,
        limit=limit
    )

    service = UsersService(db)
    return await service.list_coaches_admin(current_user, filters)


@router.post("/admin/coaches/{coach_id}/suspend", response_model=schemas.AdminActionResponse)
async def suspend_coach(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Temporarily suspend a coach account (admin only).
    Coach is soft-deleted and cannot access the system until reactivated.
    """
    service = UsersService(db)
    return await service.suspend_coach(current_user, coach_id)


@router.post("/admin/coaches/{coach_id}/reactivate", response_model=schemas.AdminActionResponse)
async def reactivate_coach(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reactivate a suspended coach account (admin only).
    """
    service = UsersService(db)
    return await service.reactivate_coach(current_user, coach_id)


@router.get("/admin/coaches/{coach_id}/stats", response_model=schemas.CoachStats)
async def get_coach_statistics(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance statistics for a specific coach (admin only).

    Returns:
    - Total classes created
    - Active classes
    - Total bookings
    - Total unique students
    - Approval status
    """
    service = UsersService(db)
    return await service.get_coach_stats(current_user, coach_id)

