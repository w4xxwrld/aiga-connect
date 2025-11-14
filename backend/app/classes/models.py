from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Text, Time, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.utils import get_utc_now
from enum import Enum

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    amateur = "amateur"
    professional = "professional"

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(SqlEnum(DifficultyLevel), default=DifficultyLevel.beginner)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Schedule - supports multiple days per week
    days_of_week = Column(JSON, nullable=False)  # change
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Capacity and pricing
    max_capacity = Column(Integer, default=20)
    price = Column(Integer, nullable=False)  # Price in tenge

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coached_classes")
    bookings = relationship("Booking", back_populates="class_obj")
