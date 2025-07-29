from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date

from app.progress import models, schemas

# Progress CRUD
async def get_progress_by_athlete(db: AsyncSession, athlete_id: int) -> Optional[models.Progress]:
    """Получить прогресс спортсмена"""
    result = await db.execute(
        select(models.Progress)
        .where(models.Progress.athlete_id == athlete_id)
        .options(
            selectinload(models.Progress.athlete),
            selectinload(models.Progress.achievements)
        )
    )
    return result.scalar_one_or_none()

async def create_progress(db: AsyncSession, progress_data: schemas.ProgressCreate) -> models.Progress:
    """Создать прогресс для спортсмена"""
    db_progress = models.Progress(**progress_data.model_dump())
    db.add(db_progress)
    await db.commit()
    await db.refresh(db_progress)
    return db_progress

async def update_progress(db: AsyncSession, athlete_id: int, progress_update: schemas.ProgressUpdate) -> Optional[models.Progress]:
    """Обновить прогресс спортсмена"""
    result = await db.execute(
        select(models.Progress).where(models.Progress.athlete_id == athlete_id)
    )
    db_progress = result.scalar_one_or_none()
    
    if not db_progress:
        return None
    
    update_data = progress_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_progress, field, value)
    
    db_progress.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_progress)
    return db_progress

async def promote_belt(db: AsyncSession, athlete_id: int, new_belt: models.BeltLevel, new_stripes: int = 0) -> Optional[models.Progress]:
    """Повысить пояс спортсмена"""
    progress = await get_progress_by_athlete(db, athlete_id)
    if not progress:
        return None
    
    # Обновляем пояс
    progress.current_belt = new_belt
    progress.current_stripes = new_stripes
    progress.belt_received_date = datetime.utcnow()
    progress.last_promotion_date = datetime.utcnow()
    progress.updated_at = datetime.utcnow()
    
    # Создаем достижение
    achievement_data = {
        "athlete_id": athlete_id,
        "progress_id": progress.id,
        "achievement_type": models.AchievementType.belt_promotion,
        "title": f"Получен {new_belt.value} пояс",
        "description": f"Повышение с {progress.current_belt.value} до {new_belt.value} пояса",
        "belt_level": new_belt,
        "points_earned": 100,  # базовые баллы за повышение
    }
    
    db_achievement = models.Achievement(**achievement_data)
    db.add(db_achievement)
    
    await db.commit()
    await db.refresh(progress)
    return progress

# Achievement CRUD
async def create_achievement(db: AsyncSession, achievement_data: schemas.AchievementCreate) -> models.Achievement:
    """Создать достижение"""
    db_achievement = models.Achievement(**achievement_data.model_dump())
    db.add(db_achievement)
    await db.commit()
    await db.refresh(db_achievement)
    return db_achievement

async def get_achievements_by_athlete(db: AsyncSession, athlete_id: int) -> List[models.Achievement]:
    """Получить все достижения спортсмена"""
    result = await db.execute(
        select(models.Achievement)
        .where(models.Achievement.athlete_id == athlete_id)
        .options(
            selectinload(models.Achievement.tournament),
            selectinload(models.Achievement.athlete)
        )
        .order_by(models.Achievement.achieved_date.desc())
    )
    return result.scalars().all()

async def get_public_achievements(db: AsyncSession, limit: int = 50) -> List[models.Achievement]:
    """Получить публичные достижения для ленты"""
    result = await db.execute(
        select(models.Achievement)
        .where(models.Achievement.is_public == True)
        .options(
            selectinload(models.Achievement.athlete),
            selectinload(models.Achievement.tournament)
        )
        .order_by(models.Achievement.achieved_date.desc())
        .limit(limit)
    )
    return result.scalars().all()

# Tournament CRUD
async def create_tournament(db: AsyncSession, tournament_data: schemas.TournamentCreate) -> models.Tournament:
    """Создать турнир"""
    db_tournament = models.Tournament(**tournament_data.model_dump())
    db.add(db_tournament)
    await db.commit()
    await db.refresh(db_tournament)
    return db_tournament

async def get_tournament(db: AsyncSession, tournament_id: int) -> Optional[models.Tournament]:
    """Получить турнир по ID"""
    result = await db.execute(
        select(models.Tournament)
        .where(models.Tournament.id == tournament_id)
        .options(selectinload(models.Tournament.participations))
    )
    return result.scalar_one_or_none()

async def get_tournaments(db: AsyncSession, skip: int = 0, limit: int = 20, status: Optional[models.TournamentStatus] = None) -> List[models.Tournament]:
    """Получить список турниров"""
    query = select(models.Tournament)
    
    if status:
        query = query.where(models.Tournament.status == status)
    
    query = query.order_by(models.Tournament.event_date.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_upcoming_tournaments(db: AsyncSession, limit: int = 10) -> List[models.Tournament]:
    """Получить предстоящие турниры"""
    result = await db.execute(
        select(models.Tournament)
        .where(
            and_(
                models.Tournament.status == models.TournamentStatus.upcoming,
                models.Tournament.event_date > datetime.utcnow()
            )
        )
        .order_by(models.Tournament.event_date.asc())
        .limit(limit)
    )
    return result.scalars().all()

async def update_tournament(db: AsyncSession, tournament_id: int, tournament_update: schemas.TournamentUpdate) -> Optional[models.Tournament]:
    """Обновить турнир"""
    result = await db.execute(
        select(models.Tournament).where(models.Tournament.id == tournament_id)
    )
    db_tournament = result.scalar_one_or_none()
    
    if not db_tournament:
        return None
    
    update_data = tournament_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tournament, field, value)
    
    db_tournament.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_tournament)
    return db_tournament

# Tournament Participation CRUD
async def register_for_tournament(db: AsyncSession, participation_data: schemas.TournamentParticipationCreate) -> models.TournamentParticipation:
    """Зарегистрировать спортсмена на турнир"""
    # Проверяем что спортсмен еще не зарегистрирован
    existing = await db.execute(
        select(models.TournamentParticipation)
        .where(
            and_(
                models.TournamentParticipation.tournament_id == participation_data.tournament_id,
                models.TournamentParticipation.athlete_id == participation_data.athlete_id
            )
        )
    )
    
    if existing.scalar_one_or_none():
        raise ValueError("Athlete is already registered for this tournament")
    
    db_participation = models.TournamentParticipation(**participation_data.model_dump())
    db.add(db_participation)
    
    # Увеличиваем счетчик участников
    tournament_result = await db.execute(
        select(models.Tournament).where(models.Tournament.id == participation_data.tournament_id)
    )
    tournament = tournament_result.scalar_one_or_none()
    if tournament:
        tournament.current_participants += 1
    
    await db.commit()
    await db.refresh(db_participation)
    return db_participation

async def get_tournament_participants(db: AsyncSession, tournament_id: int) -> List[models.TournamentParticipation]:
    """Получить участников турнира"""
    result = await db.execute(
        select(models.TournamentParticipation)
        .where(models.TournamentParticipation.tournament_id == tournament_id)
        .options(selectinload(models.TournamentParticipation.athlete))
        .order_by(models.TournamentParticipation.registration_date.asc())
    )
    return result.scalars().all()

async def get_athlete_tournaments(db: AsyncSession, athlete_id: int) -> List[models.TournamentParticipation]:
    """Получить турниры спортсмена"""
    result = await db.execute(
        select(models.TournamentParticipation)
        .where(models.TournamentParticipation.athlete_id == athlete_id)
        .options(selectinload(models.TournamentParticipation.tournament))
        .order_by(models.TournamentParticipation.registration_date.desc())
    )
    return result.scalars().all()

async def update_tournament_result(db: AsyncSession, participation_id: int, result: models.ParticipationResult, final_position: Optional[int] = None) -> Optional[models.TournamentParticipation]:
    """Обновить результат участия в турнире"""
    result_obj = await db.execute(
        select(models.TournamentParticipation).where(models.TournamentParticipation.id == participation_id)
    )
    db_participation = result_obj.scalar_one_or_none()
    
    if not db_participation:
        return None
    
    db_participation.result = result
    db_participation.final_position = final_position
    db_participation.updated_at = datetime.utcnow()
    
    # Создаем достижение если это призовое место
    if result in [models.ParticipationResult.first_place, models.ParticipationResult.second_place, models.ParticipationResult.third_place]:
        # Получаем турнир для названия
        tournament_result = await db.execute(
            select(models.Tournament).where(models.Tournament.id == db_participation.tournament_id)
        )
        tournament = tournament_result.scalar_one_or_none()
        
        if tournament:
            achievement_data = {
                "athlete_id": db_participation.athlete_id,
                "progress_id": None,  # Найдем позже
                "achievement_type": models.AchievementType.tournament_win,
                "title": f"{result.value.replace('_', ' ').title()} - {tournament.name}",
                "description": f"Занял {final_position} место в турнире {tournament.name}",
                "tournament_id": tournament.id,
                "points_earned": 50 if result == models.ParticipationResult.first_place else 30 if result == models.ParticipationResult.second_place else 20,
            }
            
            # Находим progress_id
            progress_result = await db.execute(
                select(models.Progress).where(models.Progress.athlete_id == db_participation.athlete_id)
            )
            progress = progress_result.scalar_one_or_none()
            if progress:
                achievement_data["progress_id"] = progress.id
                
                db_achievement = models.Achievement(**achievement_data)
                db.add(db_achievement)
    
    await db.commit()
    await db.refresh(db_participation)
    return db_participation
