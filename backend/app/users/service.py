"""Business logic for user operations"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile

from . import crud, schemas, models
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token
from app.users.photo_service import PhotoService
from app.config import settings


class UsersService:
    """Service for user business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def validate_registration(
        self, 
        registration_data: schemas.RegistrationData
    ) -> schemas.RegistrationData:
        """
        Validate registration data before sending OTP.
        Checks if phone number is already registered.
        """
        existing_user = await crud.get_user_by_phone(self.db, registration_data.phone_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        return registration_data
    
    async def login(self, login_data: schemas.LoginRequest) -> schemas.LoginResponse:
        """
        Login existing user with phone and password.
        Returns JWT tokens.
        """
        from app.core.security import verify_password, create_access_token, create_refresh_token
        
        # Get user by phone
        user = await crud.get_user_by_phone(self.db, login_data.phone_number)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )
        
        # Verify password
        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password not set for this user"
            )
        
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )
        
        # Generate tokens
        token_data = {
            "sub": user.phone,
            "role": user.primary_role.value,
            "user_id": user.id
        }
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        return schemas.LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=user.primary_role,
            role_status=user.role_status,
            user={
                "id": user.id,
                "phone": user.phone,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            }
        )
    
    async def refresh_token(self, refresh_token: str) -> schemas.Token:
        """Refresh access token using refresh token"""
        payload = decode_refresh_token(refresh_token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
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

        # Check if user exists
        user = await crud.get_user_by_id(self.db, payload.get("user_id"))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Create new tokens
        token_data = {
            "sub": user.phone,
            "role": user.primary_role.value,
            "user_id": user.id
        }
        new_access_token = create_access_token(data=token_data)
        new_refresh_token = create_refresh_token(data=token_data)
        
        return schemas.Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )
    
    async def update_user_profile(
        self, 
        user_id: int, 
        user_update: schemas.UserCreate,
        current_phone: str
    ) -> models.User:
        """Update user profile"""
        # Check if new phone number is already in use
        if user_update.phone != current_phone:
            existing = await crud.get_user_by_phone(self.db, user_update.phone)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number already in use"
                )
        
        updated_user = await crud.update_user(self.db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return updated_user
    
    async def get_coaches(self) -> List[models.User]:
        """Get all coaches"""
        return await crud.get_all_coaches(self.db)
    
    async def get_pending_coaches(self, requesting_user: models.User) -> List[models.User]:
        """Get all pending coaches (admin only)"""
        if requesting_user.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can view pending coaches"
            )
        return await crud.get_pending_coaches(self.db)
    
    async def get_athletes(self, requesting_user: models.User) -> List[models.User]:
        """Get all athletes (for coaches only)"""
        if requesting_user.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can view athlete list"
            )
        
        return await crud.get_all_athletes(self.db)
    
    async def select_role(
        self,
        role_data: schemas.SelectRoleRequest
    ) -> schemas.SelectRoleResponse:
        """
        Create user account and select role after OTP verification.
        This is called after user fills registration form and verifies OTP.
        """
        # Check if user already exists
        existing_user = await crud.get_user_by_phone(self.db, role_data.phone_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already registered. Please login instead."
            )
        
        # Create user with provided data and selected role
        user_data = schemas.UserCreate(
            phone=role_data.phone_number,
            first_name=role_data.first_name,
            last_name=role_data.last_name,
            email=role_data.email,
            birth_date=role_data.birth_date,
            primary_role=role_data.role,
            password=role_data.password  # Now we have password from registration form
        )
        
        user = await crud.create_user(self.db, user_data)
        
        # Generate tokens
        token_data = {
            "sub": user.phone,
            "role": user.primary_role.value,
            "user_id": user.id
        }
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        # Prepare response message
        message = None
        if user.primary_role == models.UserRole.coach:
            message = "Registration successful! Your coach application is pending approval. You can use the app as an athlete while waiting."
        
        return schemas.SelectRoleResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=user.primary_role,
            role_status=user.role_status,
            message=message
        )
    
    async def review_coach(
        self,
        admin_user: models.User,
        review_request: schemas.ReviewCoachRequest
    ) -> schemas.ReviewCoachResponse:
        """
        Admin approves or declines a coach application.
        Only admins can call this method.
        """
        # Verify admin permissions
        if admin_user.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can review coach applications"
            )
        
        # Get the user to review
        user = await crud.get_user_by_id(self.db, review_request.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify user is a coach
        if user.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a coach"
            )
        
        # Verify coach is pending
        if user.role_status != models.RoleStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coach is already {user.role_status.value}"
            )
        
        # Update status based on action
        new_status = models.RoleStatus.approved if review_request.action == "approve" else models.RoleStatus.declined
        updated_user = await crud.update_role_status(self.db, user.id, new_status)
        
        message = f"Coach application {review_request.action}d successfully"
        
        return schemas.ReviewCoachResponse(
            success=True,
            message=message,
            user_id=updated_user.id,
            new_status=updated_user.role_status
        )

    async def upload_profile_photo(self, user_id: int, file: UploadFile) -> str:
        """
        Upload profile photo for user.

        Args:
            user_id: User ID
            file: Uploaded image file

        Returns:
            Public URL of uploaded photo

        Raises:
            HTTPException: If user not found or upload fails
        """
        # Get user
        user = await crud.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Delete old photo if exists
        if user.photo_url:
            PhotoService.delete_photo(user.photo_url)

        # Upload new photo
        photo_url = await PhotoService.upload_photo(user_id, file)

        # Update user's photo_url in database
        user.photo_url = photo_url
        await self.db.commit()
        await self.db.refresh(user)

        return photo_url

    async def delete_profile_photo(self, user_id: int) -> None:
        """
        Delete profile photo for user.

        Args:
            user_id: User ID

        Raises:
            HTTPException: If user not found
        """
        # Get user
        user = await crud.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Delete photo from storage if exists
        if user.photo_url:
            PhotoService.delete_photo(user.photo_url)

        # Update user's photo_url to NULL
        user.photo_url = None
        await self.db.commit()
        await self.db.refresh(user)

    # ============================================================================
    # ADMIN ACCOUNT MANAGEMENT
    # ============================================================================

    async def create_first_admin(
        self,
        admin_request: schemas.CreateFirstAdminRequest
    ) -> schemas.AdminActionResponse:
        """
        Create the first admin user using a secret key.
        This endpoint can only be used once - when there are no admins in the system.

        Args:
            admin_request: Admin creation request with secret key

        Returns:
            Response with created admin user details

        Raises:
            HTTPException: If secret key is invalid or admin already exists
        """
        # Verify secret key
        if admin_request.admin_secret_key != settings.ADMIN_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin secret key"
            )

        # Check if any admin already exists
        existing_admins = await crud.get_users_by_role(self.db, models.UserRole.admin)
        if existing_admins:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin user already exists. Use promote endpoint instead."
            )

        # Check if phone number is already registered
        existing_user = await crud.get_user_by_phone(self.db, admin_request.phone_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

        # Create admin user
        user_data = schemas.UserCreate(
            phone=admin_request.phone_number,
            first_name=admin_request.first_name,
            last_name=admin_request.last_name,
            email=admin_request.email,
            birth_date=admin_request.birth_date,
            primary_role=models.UserRole.admin,
            password=admin_request.password
        )

        admin_user = await crud.create_user(self.db, user_data)

        return schemas.AdminActionResponse(
            success=True,
            message="First admin user created successfully",
            user=schemas.UserOut.model_validate(admin_user)
        )

    async def promote_user_to_admin(
        self,
        requesting_admin: models.User,
        promote_request: schemas.PromoteUserRequest
    ) -> schemas.AdminActionResponse:
        """
        Promote an existing user to admin role.
        Only admins can promote users.

        Args:
            requesting_admin: The admin making the request
            promote_request: User ID to promote

        Returns:
            Response with promoted user details

        Raises:
            HTTPException: If user not found or already admin
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can promote users to admin"
            )

        # Get user to promote
        user = await crud.get_user_by_id(self.db, promote_request.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check if already admin
        if user.primary_role == models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already an admin"
            )

        # Promote to admin
        user.primary_role = models.UserRole.admin
        user.role_status = None  # Admins don't need approval
        await self.db.commit()
        await self.db.refresh(user)

        return schemas.AdminActionResponse(
            success=True,
            message=f"User {user.first_name} {user.last_name} promoted to admin successfully",
            user=schemas.UserOut.model_validate(user)
        )

    async def demote_admin(
        self,
        requesting_admin: models.User,
        demote_request: schemas.DemoteAdminRequest
    ) -> schemas.AdminActionResponse:
        """
        Demote an admin back to their specified role.
        Only admins can demote other admins.

        Args:
            requesting_admin: The admin making the request
            demote_request: User ID and new role

        Returns:
            Response with demoted user details

        Raises:
            HTTPException: If user not found or not admin
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can demote admins"
            )

        # Get user to demote
        user = await crud.get_user_by_id(self.db, demote_request.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Prevent self-demotion
        if user.id == requesting_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot demote yourself"
            )

        # Check if user is admin
        if user.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not an admin"
            )

        # Demote to specified role
        user.primary_role = demote_request.new_role
        if demote_request.new_role == models.UserRole.coach:
            user.role_status = models.RoleStatus.approved  # Set as approved coach
        else:
            user.role_status = None

        await self.db.commit()
        await self.db.refresh(user)

        return schemas.AdminActionResponse(
            success=True,
            message=f"Admin {user.first_name} {user.last_name} demoted to {demote_request.new_role.value} successfully",
            user=schemas.UserOut.model_validate(user)
        )

    # ============================================================================
    # ENHANCED USER MANAGEMENT
    # ============================================================================

    async def list_users(
        self,
        requesting_admin: models.User,
        filters: schemas.UserListFilters
    ) -> schemas.UserListResponse:
        """
        List all users with filtering options.
        Only admins can list all users.

        Args:
            requesting_admin: The admin making the request
            filters: Filter options

        Returns:
            Paginated list of users

        Raises:
            HTTPException: If not admin
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can list all users"
            )

        # Get users from CRUD
        users, total = await crud.get_users_with_filters(self.db, filters)

        return schemas.UserListResponse(
            users=[schemas.UserOut.model_validate(user) for user in users],
            total=total,
            skip=filters.skip,
            limit=filters.limit
        )

    async def get_user_by_id_admin(
        self,
        requesting_admin: models.User,
        user_id: int
    ) -> schemas.UserOut:
        """
        Get detailed user information by ID (admin only).

        Args:
            requesting_admin: The admin making the request
            user_id: User ID to retrieve

        Returns:
            User details

        Raises:
            HTTPException: If not admin or user not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can view detailed user information"
            )

        user = await crud.get_user_by_id(self.db, user_id, include_deleted=True)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return schemas.UserOut.model_validate(user)

    async def update_user_by_admin(
        self,
        requesting_admin: models.User,
        user_id: int,
        update_data: schemas.UserUpdate
    ) -> schemas.AdminActionResponse:
        """
        Update any user's profile (admin only).

        Args:
            requesting_admin: The admin making the request
            user_id: User ID to update
            update_data: Updated user data

        Returns:
            Response with updated user details

        Raises:
            HTTPException: If not admin or user not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can update user profiles"
            )

        # Get user
        user = await crud.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update user fields
        if update_data.first_name is not None:
            user.first_name = update_data.first_name
        if update_data.last_name is not None:
            user.last_name = update_data.last_name
        if update_data.email is not None:
            user.email = update_data.email
        if update_data.birth_date is not None:
            user.birth_date = update_data.birth_date
        if update_data.photo_url is not None:
            user.photo_url = update_data.photo_url

        await self.db.commit()
        await self.db.refresh(user)

        return schemas.AdminActionResponse(
            success=True,
            message=f"User {user.first_name} {user.last_name} updated successfully",
            user=schemas.UserOut.model_validate(user)
        )

    async def soft_delete_user(
        self,
        requesting_admin: models.User,
        user_id: int
    ) -> schemas.AdminActionResponse:
        """
        Soft delete a user account (admin only).

        Args:
            requesting_admin: The admin making the request
            user_id: User ID to delete

        Returns:
            Success response

        Raises:
            HTTPException: If not admin or user not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can delete users"
            )

        # Prevent self-deletion
        if user_id == requesting_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account"
            )

        # Get user
        user = await crud.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Soft delete
        await user.soft_delete()
        await self.db.commit()

        return schemas.AdminActionResponse(
            success=True,
            message=f"User {user.first_name} {user.last_name} deleted successfully",
            user=None
        )

    async def restore_user(
        self,
        requesting_admin: models.User,
        user_id: int
    ) -> schemas.AdminActionResponse:
        """
        Restore a soft-deleted user account (admin only).

        Args:
            requesting_admin: The admin making the request
            user_id: User ID to restore

        Returns:
            Response with restored user details

        Raises:
            HTTPException: If not admin or user not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can restore users"
            )

        # Get user (including deleted)
        user = await crud.get_user_by_id(self.db, user_id, include_deleted=True)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not deleted"
            )

        # Restore
        await user.restore()
        await self.db.commit()
        await self.db.refresh(user)

        return schemas.AdminActionResponse(
            success=True,
            message=f"User {user.first_name} {user.last_name} restored successfully",
            user=schemas.UserOut.model_validate(user)
        )

    async def change_user_role(
        self,
        requesting_admin: models.User,
        user_id: int,
        role_request: schemas.ChangeRoleRequest
    ) -> schemas.AdminActionResponse:
        """
        Change a user's role (admin only).

        Args:
            requesting_admin: The admin making the request
            user_id: User ID to update
            role_request: New role

        Returns:
            Response with updated user details

        Raises:
            HTTPException: If not admin or user not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can change user roles"
            )

        # Prevent changing own role
        if user_id == requesting_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot change your own role"
            )

        # Get user
        user = await crud.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update role
        old_role = user.primary_role
        user.primary_role = role_request.new_role

        # Set appropriate role_status
        if role_request.new_role == models.UserRole.coach:
            user.role_status = models.RoleStatus.approved
        elif role_request.new_role == models.UserRole.admin:
            user.role_status = None
        else:
            user.role_status = None

        await self.db.commit()
        await self.db.refresh(user)

        return schemas.AdminActionResponse(
            success=True,
            message=f"User role changed from {old_role.value} to {role_request.new_role.value} successfully",
            user=schemas.UserOut.model_validate(user)
        )

    # ============================================================================
    # ENHANCED COACH MANAGEMENT
    # ============================================================================

    async def list_coaches_admin(
        self,
        requesting_admin: models.User,
        filters: schemas.CoachListFilters
    ) -> schemas.UserListResponse:
        """
        List all coaches with filtering options (admin only).

        Args:
            requesting_admin: The admin making the request
            filters: Filter options

        Returns:
            Paginated list of coaches

        Raises:
            HTTPException: If not admin
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can list all coaches"
            )

        # Convert CoachListFilters to UserListFilters
        user_filters = schemas.UserListFilters(
            role=models.UserRole.coach,  # Always filter for coaches
            role_status=filters.role_status,
            search=filters.search,
            include_deleted=filters.include_deleted,
            skip=filters.skip,
            limit=filters.limit
        )

        # Get coaches from CRUD
        coaches, total = await crud.get_users_with_filters(self.db, user_filters)

        return schemas.UserListResponse(
            users=[schemas.UserOut.model_validate(coach) for coach in coaches],
            total=total,
            skip=filters.skip,
            limit=filters.limit
        )

    async def suspend_coach(
        self,
        requesting_admin: models.User,
        coach_id: int
    ) -> schemas.AdminActionResponse:
        """
        Temporarily suspend a coach by soft deleting their account (admin only).

        Args:
            requesting_admin: The admin making the request
            coach_id: Coach user ID to suspend

        Returns:
            Success response

        Raises:
            HTTPException: If not admin or coach not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can suspend coaches"
            )

        # Get coach
        coach = await crud.get_user_by_id(self.db, coach_id)
        if not coach:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coach not found"
            )

        # Verify user is a coach
        if coach.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a coach"
            )

        # Check if already suspended
        if coach.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coach is already suspended"
            )

        # Soft delete (suspend)
        await coach.soft_delete()
        await self.db.commit()

        return schemas.AdminActionResponse(
            success=True,
            message=f"Coach {coach.first_name} {coach.last_name} suspended successfully",
            user=None
        )

    async def reactivate_coach(
        self,
        requesting_admin: models.User,
        coach_id: int
    ) -> schemas.AdminActionResponse:
        """
        Reactivate a suspended coach (admin only).

        Args:
            requesting_admin: The admin making the request
            coach_id: Coach user ID to reactivate

        Returns:
            Response with reactivated coach details

        Raises:
            HTTPException: If not admin or coach not found
        """
        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can reactivate coaches"
            )

        # Get coach (including deleted)
        coach = await crud.get_user_by_id(self.db, coach_id, include_deleted=True)
        if not coach:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coach not found"
            )

        # Verify user is a coach
        if coach.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a coach"
            )

        # Check if suspended
        if not coach.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coach is not suspended"
            )

        # Restore
        await coach.restore()
        await self.db.commit()
        await self.db.refresh(coach)

        return schemas.AdminActionResponse(
            success=True,
            message=f"Coach {coach.first_name} {coach.last_name} reactivated successfully",
            user=schemas.UserOut.model_validate(coach)
        )

    async def get_coach_stats(
        self,
        requesting_admin: models.User,
        coach_id: int
    ) -> schemas.CoachStats:
        """
        Get performance statistics for a coach (admin only).

        Args:
            requesting_admin: The admin making the request
            coach_id: Coach user ID

        Returns:
            Coach statistics

        Raises:
            HTTPException: If not admin or coach not found
        """
        from sqlalchemy import select, func, distinct
        from app.classes.models import Class
        from app.bookings.models import Booking

        # Verify requesting user is admin
        if requesting_admin.primary_role != models.UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can view coach statistics"
            )

        # Get coach
        coach = await crud.get_user_by_id(self.db, coach_id)
        if not coach:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coach not found"
            )

        # Verify user is a coach
        if coach.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a coach"
            )

        # Get total classes count
        total_classes_stmt = select(func.count()).select_from(Class).where(
            Class.coach_id == coach_id
        )
        total_classes_result = await self.db.execute(total_classes_stmt)
        total_classes = total_classes_result.scalar() or 0

        # Get active classes count (not deleted)
        active_classes_stmt = select(func.count()).select_from(Class).where(
            Class.coach_id == coach_id,
            Class.deleted_at.is_(None)
        )
        active_classes_result = await self.db.execute(active_classes_stmt)
        active_classes = active_classes_result.scalar() or 0

        # Get total bookings for this coach's classes
        total_bookings_stmt = select(func.count()).select_from(Booking).join(
            Class, Booking.class_id == Class.id
        ).where(
            Class.coach_id == coach_id
        )
        total_bookings_result = await self.db.execute(total_bookings_stmt)
        total_bookings = total_bookings_result.scalar() or 0

        # Get unique students count
        total_students_stmt = select(func.count(distinct(Booking.user_id))).select_from(Booking).join(
            Class, Booking.class_id == Class.id
        ).where(
            Class.coach_id == coach_id
        )
        total_students_result = await self.db.execute(total_students_stmt)
        total_students = total_students_result.scalar() or 0

        return schemas.CoachStats(
            coach_id=coach.id,
            coach_name=f"{coach.first_name} {coach.last_name}",
            total_classes=total_classes,
            active_classes=active_classes,
            total_bookings=total_bookings,
            total_students=total_students,
            approval_status=coach.role_status
        )