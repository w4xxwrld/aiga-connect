from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from app.progress.models import (
    BeltLevel, StripeLevel, AchievementType, 
    TournamentLevel, TournamentStatus, ParticipationResult
)

# Simple belt level schema for promotion
class BeltPromotion(BaseModel):
    belt: BeltLevel
    stripes: int = 0

# Progress Schemas
class ProgressBase(BaseModel):
    current_belt: BeltLevel = BeltLevel.white
    current_stripes: int = 0
    total_classes_attended: int = 0
    total_tournaments_participated: int = 0
    total_wins: int = 0
    total_losses: int = 0

    @field_validator("current_stripes")
    @classmethod
    def validate_stripes(cls, v):
        if not 0 <= v <= 4:
            raise ValueError("Stripes must be between 0 and 4")
        return v
    
    @field_validator("current_belt")
    @classmethod
    def validate_belt_system(cls, v):
        # Проверяем что пояс соответствует правильной системе
        # Using the actual belt levels from the enum
        valid_belts = {
            BeltLevel.white, BeltLevel.yellow, BeltLevel.orange, 
            BeltLevel.green, BeltLevel.blue, BeltLevel.brown, 
            BeltLevel.black, BeltLevel.mixed
        }
        
        if v in valid_belts:
            return v
        raise ValueError("Invalid belt level")

class ProgressCreate(ProgressBase):
    athlete_id: int

class ProgressUpdate(BaseModel):
    current_belt: Optional[BeltLevel] = None
    current_stripes: Optional[int] = None
    total_classes_attended: Optional[int] = None
    total_tournaments_participated: Optional[int] = None
    total_wins: Optional[int] = None
    total_losses: Optional[int] = None
    belt_received_date: Optional[datetime] = None
    last_promotion_date: Optional[datetime] = None

class ProgressOut(ProgressBase):
    id: int
    athlete_id: int
    belt_received_date: Optional[datetime] = None
    last_promotion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Дополнительная информация о системе поясов
    belt_system_type: Optional[str] = None  # "adult" или "juvenile"
    
    model_config = ConfigDict(from_attributes=True)

# Схема для информации о системе поясов
class BeltSystemInfo(BaseModel):
    """Информация о доступных поясах для разных возрастных групп"""
    adult_belts: List[str] = ["white", "blue", "brown", "black"]
    juvenile_belts: List[str] = ["white", "yellow", "orange", "green"]
    age_threshold: int = 16

# Achievement Schemas
class AchievementBase(BaseModel):
    achievement_type: AchievementType
    title: str
    description: Optional[str] = None
    tournament_id: Optional[int] = None
    belt_level: Optional[BeltLevel] = None
    points_earned: int = 0
    is_public: bool = True

class AchievementCreate(AchievementBase):
    athlete_id: int
    progress_id: int

class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    points_earned: Optional[int] = None
    is_public: Optional[bool] = None

class AchievementOut(AchievementBase):
    id: int
    athlete_id: int
    progress_id: int
    achieved_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Tournament Schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: str
    tournament_level: TournamentLevel = TournamentLevel.local
    age_categories: Optional[str] = None
    weight_categories: Optional[str] = None
    belt_categories: Optional[str] = None
    event_date: datetime
    organizer: Optional[str] = None
    contact_info: Optional[str] = None
    registration_fee: Optional[int] = None
    max_participants: Optional[int] = None

class TournamentCreate(TournamentBase):
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    tournament_level: Optional[TournamentLevel] = None
    age_categories: Optional[str] = None
    weight_categories: Optional[str] = None
    belt_categories: Optional[str] = None
    event_date: Optional[datetime] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    organizer: Optional[str] = None
    contact_info: Optional[str] = None
    registration_fee: Optional[int] = None
    max_participants: Optional[int] = None
    status: Optional[TournamentStatus] = None

class TournamentOut(TournamentBase):
    id: int
    status: TournamentStatus
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    current_participants: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Tournament Participation Schemas
class TournamentParticipationBase(BaseModel):
    age_category: Optional[str] = None
    weight_category: Optional[str] = None
    belt_category: Optional[str] = None
    notes: Optional[str] = None

class TournamentParticipationCreate(TournamentParticipationBase):
    tournament_id: int
    athlete_id: int

class TournamentParticipationUpdate(BaseModel):
    age_category: Optional[str] = None
    weight_category: Optional[str] = None
    belt_category: Optional[str] = None
    result: Optional[ParticipationResult] = None
    final_position: Optional[int] = None
    is_paid: Optional[bool] = None
    notes: Optional[str] = None

class TournamentParticipationOut(TournamentParticipationBase):
    id: int
    tournament_id: int
    athlete_id: int
    result: Optional[ParticipationResult] = None
    final_position: Optional[int] = None
    registration_date: datetime
    is_paid: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Combined schemas for detailed views
class UserSimple(BaseModel):
    id: int
    full_name: str
    
    model_config = ConfigDict(from_attributes=True)

class TournamentSimple(BaseModel):
    id: int
    name: str
    event_date: datetime
    tournament_level: TournamentLevel
    
    model_config = ConfigDict(from_attributes=True)

class ProgressWithAchievements(ProgressOut):
    athlete: Optional[UserSimple] = None
    achievements: List[AchievementOut] = []

class AchievementWithDetails(AchievementOut):
    athlete: Optional[UserSimple] = None
    tournament: Optional[TournamentSimple] = None

class TournamentWithParticipants(TournamentOut):
    participations: List[TournamentParticipationOut] = []

class TournamentParticipationWithDetails(TournamentParticipationOut):
    tournament: Optional[TournamentSimple] = None
    athlete: Optional[UserSimple] = None
