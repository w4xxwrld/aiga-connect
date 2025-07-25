from sqlalchemy import Column, Integer, String, Enum as SqlEnum, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    parent = "parent"
    athlete = "athlete"
    coach = "coach"

class RelationshipType(str, Enum):
    father = "father"
    mother = "mother"
    guardian = "guardian"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    iin = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)  # Обязательное поле
    email = Column(String, unique=True, index=True, nullable=False)  # Обязательное поле
    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=False)  # Обязательное поле
    emergency_contact = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    primary_role = Column(SqlEnum(UserRole), nullable=False)  # Основная роль
    is_head_coach = Column(Boolean, default=False)  # Флаг главного тренера
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user_roles = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan")
    parent_relationships = relationship("ParentAthleteRelationship", foreign_keys="ParentAthleteRelationship.parent_id", back_populates="parent")
    athlete_relationships = relationship("ParentAthleteRelationship", foreign_keys="ParentAthleteRelationship.athlete_id", back_populates="athlete")
    
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
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="user_roles")

class ParentAthleteRelationship(Base):
    __tablename__ = "parent_athlete_relationships"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    relationship_type = Column(SqlEnum(RelationshipType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parent = relationship("User", foreign_keys=[parent_id], back_populates="parent_relationships")
    athlete = relationship("User", foreign_keys=[athlete_id], back_populates="athlete_relationships")