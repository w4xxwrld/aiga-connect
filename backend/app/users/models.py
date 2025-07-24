from sqlalchemy import Column, Integer, String, Enum as SqlEnum
from app.database import Base
from enum import Enum

class UserRole(str, Enum):
    parent = "parent"
    athlete = "athlete"
    coach = "coach"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    iin = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SqlEnum(UserRole), default=UserRole.parent, nullable=False)