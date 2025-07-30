# Import all models to ensure they are registered with SQLAlchemy
from app.users.models import User, UserRole, UserRoleAssignment
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest, IndividualTrainingStatus
from app.progress.models import Progress, Achievement, Tournament, TournamentParticipation
from app.notifications.models import Notification, PushToken, NotificationTemplate
from app.merchandise.models import Product, ProductVariant, ProductCollection
from app.feedback.models import Feedback
from app.chat.models import ChatRoom, ChatMessage, ChatMembership, MessageReaction, ForumCategory, ForumTopic, ForumReply

# This file ensures all models are imported and registered with SQLAlchemy