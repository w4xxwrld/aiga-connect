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
    
    async def register_user(self, user_data: schemas.UserCreate) -> models.User:
        """Register a new user"""
        # Check if phone number already exists
        existing_user = await crud.get_user_by_phone(self.db, user_data.phone)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        return await crud.create_user(self.db, user_data)
    
    async def login_user(self, login_data: schemas.UserLogin) -> schemas.Token:
        """Authenticate user and issue JWT tokens"""
        user = await crud.authenticate_user(
            self.db, 
            login_data.phone, 
            login_data.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )
        
        # Create JWT tokens
        token_data = {
            "sub": user.phone,
            "role": user.primary_role.value,
            "user_id": user.id
        }
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        return schemas.Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
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
    
    async def get_athletes(self, requesting_user: models.User) -> List[models.User]:
        """Get all athletes (for coaches only)"""
        if requesting_user.primary_role != models.UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can view athlete list"
            )
        
        return await crud.get_all_athletes(self.db)
