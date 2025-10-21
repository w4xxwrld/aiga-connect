from sqlalchemy import Column, Integer, String, Enum as SqlEnum, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.utils import get_utc_now
from enum import Enum

class UserRole(str, Enum):
    athlete = "athlete"
    coach = "coach"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)  # Primary identifier
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)  # Profile picture
    email = Column(String, nullable=True)  # Optional
    birth_date = Column(Date, nullable=False)
    hashed_password = Column(String, nullable=True)  # Will be optional for SMS auth
    primary_role = Column(SqlEnum(UserRole), nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    coached_classes = relationship("Class", foreign_keys="Class.coach_id", back_populates="coach")