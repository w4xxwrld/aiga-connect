from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.users.models import User, UserRole
from app.progress import schemas, crud
from app.progress.models import TournamentStatus, ParticipationResult

router = APIRouter()

# Belt system info endpoint
@router.get("/belt-system", response_model=schemas.BeltSystemInfo)
async def get_belt_system_info():
    """Получить информацию о системе поясов для разных возрастных групп"""
    return schemas.BeltSystemInfo()

# Progress endpoints
@router.get("/progress/{athlete_id}", response_model=schemas.ProgressWithAchievements)
async def get_athlete_progress(
    athlete_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить прогресс спортсмена"""
    progress = await crud.get_progress_by_athlete(db, athlete_id)
    if not progress:
        # Создаем прогресс если его нет
        progress_data = schemas.ProgressCreate(athlete_id=athlete_id)
        progress = await crud.create_progress(db, progress_data)
    
    return progress

@router.post("/progress", response_model=schemas.ProgressOut)
async def create_athlete_progress(
    progress_data: schemas.ProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать прогресс для спортсмена (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create progress records"
        )
    
    # Проверяем что прогресс еще не существует
    existing = await crud.get_progress_by_athlete(db, progress_data.athlete_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress already exists for this athlete"
        )
    
    return await crud.create_progress(db, progress_data)

@router.put("/progress/{athlete_id}", response_model=schemas.ProgressOut)
async def update_athlete_progress(
    athlete_id: int,
    progress_update: schemas.ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить прогресс спортсмена (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can update progress"
        )
    
    progress = await crud.update_progress(db, athlete_id, progress_update)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found"
        )
    
    return progress

@router.post("/progress/{athlete_id}/promote", response_model=schemas.ProgressOut)
async def promote_athlete_belt(
    athlete_id: int,
    promotion_data: schemas.BeltPromotion,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Повысить пояс спортсмена (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can promote athletes"
        )
    
    progress = await crud.promote_belt(db, athlete_id, promotion_data.belt, promotion_data.stripes)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete progress not found"
        )
    
    return progress

# Achievement endpoints
@router.get("/achievements/public", response_model=List[schemas.AchievementWithDetails])
async def get_public_achievements(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Получить публичные достижения для ленты"""
    return await crud.get_public_achievements(db, limit)

@router.get("/achievements/athlete/{athlete_id}", response_model=List[schemas.AchievementWithDetails])
async def get_athlete_achievements(
    athlete_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить достижения спортсмена"""
    return await crud.get_achievements_by_athlete(db, athlete_id)

@router.get("/achievements", response_model=List[schemas.AchievementWithDetails])
async def get_all_achievements(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все достижения (для авторизованных пользователей)"""
    return await crud.get_all_achievements(db, skip, limit)

@router.post("/achievements", response_model=schemas.AchievementOut)
async def create_achievement(
    achievement_data: schemas.AchievementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать достижение (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can create achievements"
        )
    
    return await crud.create_achievement(db, achievement_data)

# Tournament endpoints
@router.post("/tournaments", response_model=schemas.TournamentOut)
async def create_tournament(
    tournament_data: schemas.TournamentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать турнир (только главный тренер)"""
    if not current_user.is_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only head coach can create tournaments"
        )
    
    return await crud.create_tournament(db, tournament_data)

@router.get("/tournaments", response_model=List[schemas.TournamentOut])
async def get_tournaments(
    skip: int = 0,
    limit: int = 20,
    status: Optional[TournamentStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить список турниров"""
    return await crud.get_tournaments(db, skip, limit, status)

@router.get("/tournaments/upcoming", response_model=List[schemas.TournamentOut])
async def get_upcoming_tournaments(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Получить предстоящие турниры"""
    return await crud.get_upcoming_tournaments(db, limit)

@router.get("/tournaments/{tournament_id}", response_model=schemas.TournamentWithParticipants)
async def get_tournament(
    tournament_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить турнир по ID"""
    tournament = await crud.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return tournament

@router.put("/tournaments/{tournament_id}", response_model=schemas.TournamentOut)
async def update_tournament(
    tournament_id: int,
    tournament_update: schemas.TournamentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить турнир (только главный тренер)"""
    if not current_user.is_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only head coach can update tournaments"
        )
    
    tournament = await crud.update_tournament(db, tournament_id, tournament_update)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return tournament

# Tournament Participation endpoints
@router.post("/tournaments/{tournament_id}/register", response_model=schemas.TournamentParticipationOut)
async def register_for_tournament(
    tournament_id: int,
    participation_data: schemas.TournamentParticipationBase,
    athlete_id: Optional[int] = None,  # Для родителей, регистрирующих детей
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Зарегистрироваться на турнир"""
    user_roles = [ur.role for ur in current_user.user_roles]
    
    # Определяем кого регистрируем
    if UserRole.parent in user_roles and athlete_id:
        # Родитель регистрирует ребенка
        target_athlete_id = athlete_id
        # TODO: Проверить что это действительно его ребенок
    elif UserRole.athlete in user_roles:
        # Спортсмен регистрирует себя
        target_athlete_id = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes and parents can register for tournaments"
        )
    
    registration_data = schemas.TournamentParticipationCreate(
        tournament_id=tournament_id,
        athlete_id=target_athlete_id,
        **participation_data.model_dump()
    )
    
    try:
        return await crud.register_for_tournament(db, registration_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/participants", response_model=List[schemas.TournamentParticipationWithDetails])
async def get_tournament_participants(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить участников турнира (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can view tournament participants"
        )
    
    return await crud.get_tournament_participants(db, tournament_id)


@router.get("/tournaments/{tournament_id}/check-registration", response_model=schemas.TournamentParticipationOut)
async def check_tournament_registration(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Проверить регистрацию текущего пользователя на турнир (для спортсменов)"""
    # Проверяем что пользователь является спортсменом
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.athlete not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes can check their own registration"
        )
    
    # Проверяем регистрацию текущего пользователя
    participation = await crud.get_tournament_participation_by_athlete(db, tournament_id, current_user.id)
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not registered for this tournament"
        )
    
    return participation

@router.get("/athletes/{athlete_id}/tournaments", response_model=List[schemas.TournamentParticipationWithDetails])
async def get_athlete_tournaments(
    athlete_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить турниры спортсмена"""
    return await crud.get_athlete_tournaments(db, athlete_id)

@router.put("/tournaments/participation/{participation_id}/result", response_model=schemas.TournamentParticipationOut)
async def update_tournament_result(
    participation_id: int,
    result: ParticipationResult,
    final_position: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить результат участия в турнире (только тренеры)"""
    user_roles = [ur.role for ur in current_user.user_roles]
    if UserRole.coach not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches can update tournament results"
        )
    
    participation = await crud.update_tournament_result(db, participation_id, result, final_position)
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament participation not found"
        )
    
    return participation


