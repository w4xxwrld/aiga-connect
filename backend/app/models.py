# Import all models to ensure they are registered with SQLAlchemy
from app.users.models import User, UserRole, UserRoleAssignment
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest, IndividualTrainingStatus

# This file ensures all models are imported and registered with SQLAlchemy 