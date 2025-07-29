from sqlalchemy import Column, Integer, String, Enum as SqlEnum, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum
from datetime import datetime

# Используем существующий enum из базы данных
class BeltLevel(str, Enum):
    white = "white"
    yellow = "yellow"  # Из существующего enum
    orange = "orange"  # Из существующего enum  
    green = "green"    # Из существующего enum
    blue = "blue"
    brown = "brown"
    black = "black"
    mixed = "mixed"    # Из существующего enum

class StripeLevel(int, Enum):
    zero = 0
    one = 1
    two = 2
    three = 3
    four = 4

class AchievementType(str, Enum):
    belt_promotion = "belt_promotion"
    tournament_win = "tournament_win"
    tournament_participation = "tournament_participation"
    attendance_milestone = "attendance_milestone"
    technique_mastery = "technique_mastery"
    special_recognition = "special_recognition"

class TournamentLevel(str, Enum):
    local = "local"
    regional = "regional"
    national = "national"
    international = "international"

class TournamentStatus(str, Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class ParticipationResult(str, Enum):
    first_place = "first_place"
    second_place = "second_place"
    third_place = "third_place"
    participated = "participated"
    dnf = "dnf"  # did not finish

class Progress(Base):
    """Прогресс спортсмена - пояса, полоски, общая статистика"""
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Текущий уровень
    current_belt = Column(SqlEnum(BeltLevel, name='beltlevel'), default=BeltLevel.white)
    current_stripes = Column(Integer, default=0)  # 0-4 полоски
    
    # Статистика
    total_classes_attended = Column(Integer, default=0)
    total_tournaments_participated = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_losses = Column(Integer, default=0)
    
    # Даты
    belt_received_date = Column(DateTime, nullable=True)  # когда получен текущий пояс
    last_promotion_date = Column(DateTime, nullable=True)  # последнее повышение
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id])
    achievements = relationship("Achievement", back_populates="athlete_progress")
    
    @property
    def is_juvenile_division(self):
        """Проверяет, находится ли спортсмен в ювенильном дивизионе"""
        # Предполагаем, что возраст хранится в связанной модели User
        return self.athlete and self.athlete.age < 16
    
    @property
    def belt_system_type(self):
        """Возвращает тип системы поясов"""
        return "juvenile" if self.is_juvenile_division else "adult"
    
    def get_appropriate_default_belt(self):
        """Возвращает начальный пояс для соответствующего дивизиона"""
        # Используем только доступные значения из существующего enum
        return BeltLevel.white

class Achievement(Base):
    """Достижения спортсмена"""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    progress_id = Column(Integer, ForeignKey("progress.id"), nullable=False)
    
    # Тип и описание достижения
    achievement_type = Column(SqlEnum(AchievementType), nullable=False)
    title = Column(String, nullable=False)  # "Получен синий пояс", "1 место на турнире XYZ"
    description = Column(Text, nullable=True)
    
    # Связанные данные
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)  # если связано с турниром
    belt_level = Column(SqlEnum(BeltLevel, name='beltlevel'), nullable=True)  # если это повышение пояса
    
    # Метаданные
    points_earned = Column(Integer, default=0)  # баллы за достижение
    is_public = Column(Boolean, default=True)  # показывать ли всем
    
    achieved_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id])
    athlete_progress = relationship("Progress", back_populates="achievements")
    tournament = relationship("Tournament", back_populates="achievements")

class Tournament(Base):
    """Турниры"""
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    
    # Уровень и категории
    tournament_level = Column(SqlEnum(TournamentLevel), default=TournamentLevel.local)
    age_categories = Column(String, nullable=True)  # "10-12, 13-15, 16-18, взрослые"
    weight_categories = Column(String, nullable=True)  # "до 60кг, 60-70кг, 70+кг"
    belt_categories = Column(String, nullable=True)  # "белые-синие, фиолетовые+, открытая"
    
    # Даты и статус
    registration_start = Column(DateTime, nullable=True)
    registration_end = Column(DateTime, nullable=True)
    event_date = Column(DateTime, nullable=False)
    status = Column(SqlEnum(TournamentStatus), default=TournamentStatus.upcoming)
    
    # Организация
    organizer = Column(String, nullable=True)
    contact_info = Column(String, nullable=True)
    registration_fee = Column(Integer, nullable=True)  # в тенге
    
    # Метаданные
    max_participants = Column(Integer, nullable=True)
    current_participants = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participations = relationship("TournamentParticipation", back_populates="tournament")
    achievements = relationship("Achievement", back_populates="tournament")

class TournamentParticipation(Base):
    """Участие спортсменов в турнирах"""
    __tablename__ = "tournament_participations"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Категории участия
    age_category = Column(String, nullable=True)
    weight_category = Column(String, nullable=True)
    belt_category = Column(String, nullable=True)
    
    # Результат
    result = Column(SqlEnum(ParticipationResult), nullable=True)
    final_position = Column(Integer, nullable=True)  # финальное место (1, 2, 3, etc.)
    
    # Детали
    registration_date = Column(DateTime, default=datetime.utcnow)
    is_paid = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tournament = relationship("Tournament", back_populates="participations")
    athlete = relationship("User", foreign_keys=[athlete_id])
