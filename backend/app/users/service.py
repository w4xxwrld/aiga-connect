"""Business logic for user operations"""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from . import crud, schemas, models
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token


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