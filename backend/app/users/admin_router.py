from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.deps import get_db, require_admin
from app.users import schemas
from app.users.models import User
from app.users.service import UsersService


router = APIRouter()


# ============================================================================
# COACH MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/pending-coaches", response_model=List[schemas.UserSimple])
async def get_pending_coaches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin endpoint to get all coaches with pending status.
    Only administrators can access this endpoint.
    """
    service = UsersService(db)
    return await service.get_pending_coaches(current_user)


@router.post("/review-coach", response_model=schemas.ReviewCoachResponse)
async def review_coach(
    review_request: schemas.ReviewCoachRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin endpoint to approve or decline coach applications.
    Only administrators can access this endpoint.
    """
    service = UsersService(db)
    return await service.review_coach(current_user, review_request)


# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/users", response_model=schemas.UserListResponse)
async def list_all_users(
    role: str = None,
    role_status: str = None,
    search: str = None,
    include_deleted: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
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
    role_enum = None
    role_status_enum = None

    if role:
        try:
            role_enum = UserRole(role)
        except ValueError:
            valid_roles = [r.value for r in UserRole]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{role}'. Valid values: {valid_roles}"
            )

    if role_status:
        try:
            role_status_enum = RoleStatus(role_status)
        except ValueError:
            valid_statuses = [s.value for s in RoleStatus]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role_status '{role_status}'. Valid values: {valid_statuses}"
            )

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


@router.get("/users/{user_id}", response_model=schemas.UserOut)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get detailed information about a specific user (admin only).
    """
    service = UsersService(db)
    return await service.get_user_by_id_admin(current_user, user_id)


@router.put("/users/{user_id}", response_model=schemas.AdminActionResponse)
async def update_user(
    user_id: int,
    update_data: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update any user's profile information (admin only).
    """
    service = UsersService(db)
    return await service.update_user_by_admin(current_user, user_id, update_data)


@router.delete("/users/{user_id}", response_model=schemas.AdminActionResponse)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Soft delete a user account (admin only).
    User data is preserved but marked as deleted.
    """
    service = UsersService(db)
    return await service.soft_delete_user(current_user, user_id)


@router.post("/users/{user_id}/restore", response_model=schemas.AdminActionResponse)
async def restore_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Restore a soft-deleted user account (admin only).
    """
    service = UsersService(db)
    return await service.restore_user(current_user, user_id)


@router.put("/users/{user_id}/role", response_model=schemas.AdminActionResponse)
async def change_user_role(
    user_id: int,
    role_request: schemas.ChangeRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Change a user's role (admin only).
    """
    service = UsersService(db)
    return await service.change_user_role(current_user, user_id, role_request)


# ============================================================================
# ENHANCED COACH MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/coaches", response_model=schemas.UserListResponse)
async def list_all_coaches_admin(
    role_status: str = None,
    search: str = None,
    include_deleted: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
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
    role_status_enum = None
    if role_status:
        try:
            role_status_enum = RoleStatus(role_status)
        except ValueError:
            valid_statuses = [s.value for s in RoleStatus]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role_status '{role_status}'. Valid values: {valid_statuses}"
            )

    filters = schemas.CoachListFilters(
        role_status=role_status_enum,
        search=search,
        include_deleted=include_deleted,
        skip=skip,
        limit=limit
    )

    service = UsersService(db)
    return await service.list_coaches_admin(current_user, filters)


@router.post("/coaches/{coach_id}/suspend", response_model=schemas.AdminActionResponse)
async def suspend_coach(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Temporarily suspend a coach account (admin only).
    Coach is soft-deleted and cannot access the system until reactivated.
    """
    service = UsersService(db)
    return await service.suspend_coach(current_user, coach_id)


@router.post("/coaches/{coach_id}/reactivate", response_model=schemas.AdminActionResponse)
async def reactivate_coach(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Reactivate a suspended coach account (admin only).
    """
    service = UsersService(db)
    return await service.reactivate_coach(current_user, coach_id)


@router.get("/coaches/{coach_id}/stats", response_model=schemas.CoachStats)
async def get_coach_statistics(
    coach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
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
