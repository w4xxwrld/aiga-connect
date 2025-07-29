from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime

class NotificationType(str, Enum):
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    training_reminder = "training_reminder"
    tournament_announcement = "tournament_announcement"
    achievement_earned = "achievement_earned"
    belt_promotion = "belt_promotion"
    individual_training_accepted = "individual_training_accepted"
    individual_training_declined = "individual_training_declined"
    schedule_change = "schedule_change"
    general_announcement = "general_announcement"

class NotificationPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"

class Notification(Base):
    """Уведомления для пользователей"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Содержание уведомления
    type = Column(SqlEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)  # "Тренировка подтверждена"
    message = Column(Text, nullable=False)  # "Ваша тренировка на 15:00 подтверждена"
    
    # Приоритет и метаданные
    priority = Column(SqlEnum(NotificationPriority), default=NotificationPriority.normal)
    data = Column(JSON, nullable=True)  # Дополнительные данные (ID тренировки, турнира и т.д.)
    
    # Статус
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)  # Отправлено ли push-уведомление
    
    # Время
    scheduled_for = Column(DateTime, nullable=True)  # Запланированное время отправки
    sent_at = Column(DateTime, nullable=True)  # Время отправки
    read_at = Column(DateTime, nullable=True)  # Время прочтения
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Время истечения уведомления

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

class PushToken(Base):
    """Токены для push-уведомлений"""
    __tablename__ = "push_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Токен и платформа
    token = Column(String, nullable=False, unique=True)
    platform = Column(String, nullable=False)  # "ios", "android", "web"
    device_info = Column(JSON, nullable=True)  # Информация об устройстве
    
    # Статус
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

class NotificationTemplate(Base):
    """Шаблоны уведомлений"""
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    
    # Тип и содержание
    type = Column(SqlEnum(NotificationType), nullable=False, unique=True)
    title_template = Column(String, nullable=False)  # "Тренировка {class_name}"
    message_template = Column(Text, nullable=False)  # "Ваша тренировка {class_name} в {time} подтверждена"
    
    # Настройки
    default_priority = Column(SqlEnum(NotificationPriority), default=NotificationPriority.normal)
    is_push_enabled = Column(Boolean, default=True)  # Отправлять ли push
    is_email_enabled = Column(Boolean, default=False)  # Отправлять ли email
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
