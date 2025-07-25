from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Text, Boolean, Time
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class ClassStatus(str, Enum):
    active = "active"
    cancelled = "cancelled"
    completed = "completed"

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # например: "Грэпплинг для начинающих", "Грэпплинг детская группа"
    description = Column(Text, nullable=True)
    difficulty_level = Column(SqlEnum(DifficultyLevel), default=DifficultyLevel.beginner)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Расписание
    day_of_week = Column(String, nullable=False)  # "понедельник", "вторник", etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Возрастные группы для грэпплинга
    age_group_min = Column(Integer, nullable=True)  # минимальный возраст
    age_group_max = Column(Integer, nullable=True)  # максимальный возраст
    max_capacity = Column(Integer, default=20)
    price_per_class = Column(Integer, nullable=False)  # цена в тенге за занятие
    
    # Статус
    status = Column(SqlEnum(ClassStatus), default=ClassStatus.active)
    is_trial_available = Column(Boolean, default=True)  # пробные занятия
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    coach = relationship("User", foreign_keys=[coach_id])
    bookings = relationship("Booking", back_populates="class_obj")
