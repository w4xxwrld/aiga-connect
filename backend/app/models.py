# Import all models to ensure they are registered with SQLAlchemy
from app.users.models import User, UserRole, UserRoleAssignment
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest, IndividualTrainingStatus
from app.merchandise.models import Product, ProductVariant, ProductCollection
from app.feedback.models import Feedback

# This file ensures all models are imported and registered with SQLAlchemy