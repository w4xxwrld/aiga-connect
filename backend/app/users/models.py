from sqlalchemy import Column, Integer, String, Enum as SqlEnum, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.utils import get_utc_now
from enum import Enum

# Import Class model to fix relationship
from app.classes.models import Class

class UserRole(str, Enum):
    athlete = "athlete"
    coach = "coach"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    iin = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)  # Обязательное поле
    email = Column(String, unique=True, index=True, nullable=False)  # Обязательное поле
    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=False)  # Обязательное поле
    hashed_password = Column(String, nullable=False)
    primary_role = Column(SqlEnum(UserRole), nullable=False, index=True)  # Основная роль
    is_head_coach = Column(Boolean, default=False, index=True)  # Флаг главного тренера
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    user_roles = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan")
    coached_classes = relationship("Class", foreign_keys="Class.coach_id", back_populates="coach")
    
    def has_role(self, role: UserRole) -> bool:
        """Проверить, есть ли у пользователя указанная роль"""
        return any(ur.role == role for ur in self.user_roles)
    
    def get_roles(self) -> list[UserRole]:
        """Получить все роли пользователя"""
        return [ur.role for ur in self.user_roles]

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(SqlEnum(UserRole), nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    user = relationship("User", back_populates="user_roles")