from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.utils import get_utc_now
from enum import Enum

class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"

class BookingType(str, Enum):
    regular = "regular"
    trial = "trial"
    makeup = "makeup"  # компенсационное занятие

class IndividualTrainingStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    completed = "completed"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)

    booking_type = Column(SqlEnum(BookingType), default=BookingType.regular)
    status = Column(SqlEnum(BookingStatus), default=BookingStatus.pending, index=True)

    # Booking details
    booking_date = Column(DateTime, default=get_utc_now)
    class_date = Column(DateTime, nullable=False, index=True)  # дата конкретного занятия

    # Payment info
    is_paid = Column(Boolean, default=False)
    payment_amount = Column(Integer, nullable=True)

    # Notes
    notes = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id])
    class_obj = relationship("Class", back_populates="bookings")

class IndividualTrainingRequest(Base):
    __tablename__ = "individual_training_requests"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Training details
    requested_date = Column(DateTime, nullable=False, index=True)  # желаемая дата индивидуальной тренировки
    preferred_time_start = Column(String, nullable=True)  # предпочтительное время начала (HH:MM)
    preferred_time_end = Column(String, nullable=True)  # предпочтительное время окончания (HH:MM)

    # Request details
    status = Column(SqlEnum(IndividualTrainingStatus), default=IndividualTrainingStatus.pending, index=True)
    request_date = Column(DateTime, default=get_utc_now)

    # Training details (filled by coach when accepted)
    scheduled_date = Column(DateTime, nullable=True)  # назначенная дата
    scheduled_time_start = Column(String, nullable=True)  # назначенное время начала
    scheduled_time_end = Column(String, nullable=True)  # назначенное время окончания

    # Payment info
    is_paid = Column(Boolean, default=False)
    payment_amount = Column(Integer, nullable=True)

    # Notes and reasons
    athlete_notes = Column(String, nullable=True)  # заметки от спортсмена/родителя
    coach_notes = Column(String, nullable=True)  # заметки от тренера
    decline_reason = Column(String, nullable=True)  # причина отклонения

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id])
    coach = relationship("User", foreign_keys=[coach_id])
