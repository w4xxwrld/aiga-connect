"""Business logic for bookings operations"""
from typing import List, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from . import crud, schemas, models
from .models import IndividualTrainingStatus
from app.users.models import User, UserRole
from app.config import settings


class BookingsService:
    """Business logic service for bookings"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_booking(
        self,
        booking_data: schemas.BookingCreate,
        current_user: User
    ) -> models.Booking:
        """Create a booking with checks"""
        # Get class information
        from app.classes import crud as class_crud
        class_obj = await class_crud.get_class_by_id(self.db, booking_data.class_id)
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Get athlete information
        from app.users import crud as user_crud
        athlete = await user_crud.get_user_by_id(self.db, booking_data.athlete_id)
        if not athlete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete not found"
            )

        # Check rights (only athletes for themselves)
        if current_user.primary_role != UserRole.athlete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only athletes can create bookings"
            )
        
        if booking_data.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes can only book for themselves"
            )
        
        return await crud.create_booking(self.db, booking_data)
    
    async def get_my_bookings(self, current_user: User) -> List[models.Booking]:
        """Get my bookings"""
        if current_user.primary_role == UserRole.athlete:
            return await crud.get_bookings_by_athlete(self.db, current_user.id)
        else:  # coach
            return await crud.get_bookings_by_coach(self.db, current_user.id)
    
    async def cancel_booking(
        self,
        booking_id: int,
        cancellation_reason: str,
        current_user: User
    ) -> models.Booking:
        """Cancel a booking"""
        booking = await crud.get_booking(self.db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Проверить права на отмену
        if current_user.primary_role == UserRole.athlete and booking.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own bookings"
            )
        
        return await crud.cancel_booking(self.db, booking_id, cancellation_reason)
    
    async def get_booking(
        self,
        booking_id: int,
        current_user: User
    ) -> models.Booking:
        """Get booking by ID"""
        booking = await crud.get_booking(self.db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )

        # Check access rights
        if current_user.primary_role == UserRole.athlete and booking.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return booking
    
    async def approve_booking(
        self,
        booking_id: int,
        current_user: User
    ) -> models.Booking:
        """Approve a booking (for coaches only)"""
        if current_user.primary_role != UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can approve bookings"
            )
        
        booking = await crud.get_booking(self.db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        return await crud.approve_booking(self.db, booking_id)
    
    async def get_individual_training_requests(
        self,
        current_user: User,
        status_filter: str = None
    ) -> List:
        """Get individual training requests"""
        if current_user.primary_role == UserRole.coach:
            return await crud.get_individual_training_requests_for_coach(
                self.db,
                current_user.id,
                status_filter
            )
        else:  # athlete
            return await crud.get_individual_training_requests_by_athlete(
                self.db,
                current_user.id,
                status_filter
            )
    
    async def decline_booking(
        self,
        booking_id: int,
        decline_reason: str,
        current_user: User
    ):
        """Decline a booking (for coaches only)"""
        if current_user.primary_role != UserRole.coach:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can decline bookings"
            )
        
        booking = await crud.get_booking(self.db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )

        # Check if the coach is the coach of this class
        from app.classes import crud as class_crud
        class_obj = await class_crud.get_class_by_id(self.db, booking.class_id)
        if not class_obj or class_obj.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only decline bookings for your own classes"
            )
        
        declined_booking = await crud.decline_booking(self.db, booking_id, decline_reason)
        return declined_booking
    
    async def create_individual_training_request(
        self,
        request_data: schemas.IndividualTrainingRequestCreate,
        current_user: User
    ):
        """Create a request for individual training"""
        # Check user roles
        user_roles = [ur.role for ur in current_user.user_roles]
        has_athlete_role = UserRole.athlete in user_roles

        if not has_athlete_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only athletes can request individual training"
            )

        # Check if the requested coach exists and is a coach
        from app.users import crud as user_crud
        coach = await user_crud.get_user(self.db, request_data.coach_id)
        if not coach or not await user_crud.user_has_role(self.db, coach.id, UserRole.coach):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coach not found"
            )

        # Check pending requests limit for the coach
        pending_count = await crud.count_pending_individual_training_requests_by_coach(
            self.db, 
            request_data.coach_id
        )
        max_pending = settings.MAX_PENDING_TRAINING_REQUESTS
        if pending_count >= max_pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coach has reached the maximum number of pending requests ({max_pending})"
            )

        # Check rights (only athletes for themselves)
        if request_data.athlete_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes can only request individual training for themselves"
            )

        new_request = await crud.create_individual_training_request(self.db, request_data)
        return new_request
    
    async def get_my_individual_training_requests(
        self,
        current_user: User
    ):
        """Get my individual training requests"""
        user_roles = [ur.role for ur in current_user.user_roles]
        if UserRole.athlete in user_roles:
            requests = await crud.get_individual_training_requests_by_athlete(
                self.db,
                current_user.id
            )
        else:  # coach
            requests = await crud.get_individual_training_requests_by_coach(
                self.db,
                current_user.id
            )
        return requests
    
    async def get_pending_individual_training_requests(
        self,
        current_user: User
    ):
        """Get pending individual training requests (for coaches only)"""
        user_roles = [ur.role for ur in current_user.user_roles]
        if UserRole.coach not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can view pending individual training requests"
            )
        
        requests = await crud.get_pending_individual_training_requests_by_coach(
            self.db,
            current_user.id
        )
        return requests
    
    async def get_individual_training_request(
        self,
        request_id: int,
        current_user: User
    ):
        """Get individual training request information"""
        request = await crud.get_individual_training_request(self.db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Individual training request not found"
            )

        # Check access rights
        user_roles = [ur.role for ur in current_user.user_roles]
        if (UserRole.athlete in user_roles and request.athlete_id != current_user.id) or \
           (UserRole.coach in user_roles and request.coach_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return request
    
    async def accept_individual_training_request(
        self,
        request_id: int,
        update_data: schemas.IndividualTrainingRequestUpdate,
        current_user: User
    ):
        """Accept an individual training request (for coaches only)"""
        # Check if the user is a coach
        user_roles = [ur.role for ur in current_user.user_roles]
        if UserRole.coach not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can accept individual training requests"
            )
        
        request = await crud.get_individual_training_request(self.db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Individual training request not found"
            )

        # Check if the coach is the coach of this request
        if request.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only accept requests for your own individual training"
            )

        # Check if the request is in pending status
        if request.status != IndividualTrainingStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only accept pending requests"
            )
        
        accepted_request = await crud.accept_individual_training_request(
            self.db,
            request_id,
            update_data
        )
        return accepted_request
    
    async def decline_individual_training_request(
        self,
        request_id: int,
        decline_reason: str,
        current_user: User
    ):
        """Decline an individual training request (for coaches only)"""
        # Check if the user is a coach
        user_roles = [ur.role for ur in current_user.user_roles]
        if UserRole.coach not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can decline individual training requests"
            )
        
        request = await crud.get_individual_training_request(self.db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Individual training request not found"
            )

        # Check if the coach is the coach of this request
        if request.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only decline requests for your own individual training"
            )

        # Check if the request is in pending status
        if request.status != IndividualTrainingStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only decline pending requests"
            )
        
        declined_request = await crud.decline_individual_training_request(
            self.db,
            request_id,
            decline_reason
        )
        return declined_request
    
    async def complete_individual_training_request(
        self,
        request_id: int,
        current_user: User
    ):
        """Complete an individual training request (for coaches only)"""
        # Check if the user is a coach
        user_roles = [ur.role for ur in current_user.user_roles]
        if UserRole.coach not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only coaches can complete individual training requests"
            )
        
        request = await crud.get_individual_training_request(self.db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Individual training request not found"
            )

        # Check if the coach is the coach of this request
        if request.coach_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only complete your own individual training"
            )

        # Check if the request is in accepted status
        if request.status != IndividualTrainingStatus.accepted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only complete accepted requests"
            )
        
        completed_request = await crud.complete_individual_training_request(
            self.db,
            request_id
        )
        return completed_request
