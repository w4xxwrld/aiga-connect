from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from typing import Optional, List
from datetime import date

from app.users import models, schemas
from app.core.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User).where(models.User.email == email)
    )
    return result.scalars().first()


async def get_user_by_iin(db: AsyncSession, iin: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User).where(models.User.iin == iin)
    )
    return result.scalars().first()


async def get_user(db: AsyncSession, user_id: int) -> Optional[models.User]:
    result = await db.execute(
        select(models.User)
        .where(models.User.id == user_id)
        .options(selectinload(models.User.user_roles))
    )
    return result.scalars().first()


async def create_user(db: AsyncSession, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        iin=user.iin,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        birth_date=user.birth_date,
        emergency_contact=user.emergency_contact,
        hashed_password=hashed_password,
        primary_role=user.primary_role,
        is_head_coach=user.is_head_coach,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Добавить основную роль в таблицу ролей
    primary_role_assignment = models.UserRoleAssignment(
        user_id=db_user.id,
        role=user.primary_role
    )
    db.add(primary_role_assignment)
    
    # Добавить дополнительные роли, если есть
    for role in user.additional_roles:
        if role != user.primary_role:  # Избежать дублирования основной роли
            role_assignment = models.UserRoleAssignment(
                user_id=db_user.id,
                role=role
            )
            db.add(role_assignment)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def check_minor_athlete_has_parent(db: AsyncSession, athlete_id: int) -> bool:
    """Проверить, что у несовершеннолетнего спортсмена есть родитель/опекун"""
    athlete = await get_user(db, athlete_id)
    if not athlete:
        return True  # Пользователь не найден, проверка не нужна
    
    # Проверить, есть ли роль спортсмена
    athlete_roles = [ur.role for ur in athlete.user_roles]
    if models.UserRole.athlete not in athlete_roles:
        return True  # Не спортсмен, проверка не нужна
    
    # Вычисляем возраст
    today = date.today()
    age = today.year - athlete.birth_date.year
    if today.month < athlete.birth_date.month or (today.month == athlete.birth_date.month and today.day < athlete.birth_date.day):
        age -= 1
    
    if age >= 16:
        return True  # Совершеннолетний
    
    # Проверяем наличие родителя/опекуна
    result = await db.execute(
        select(models.ParentAthleteRelationship)
        .where(models.ParentAthleteRelationship.athlete_id == athlete_id)
    )
    relationships = result.scalars().all()
    
    return len(relationships) > 0


async def authenticate_user(db: AsyncSession, iin: str, password: str) -> Optional[models.User]:
    result = await db.execute(
        select(models.User)
        .where(models.User.iin == iin)
        .options(selectinload(models.User.user_roles))
    )
    user = result.scalars().first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# Parent-Athlete Relationship functions
async def create_parent_athlete_relationship(
    db: AsyncSession, 
    relationship: schemas.ParentAthleteRelationshipCreate
) -> models.ParentAthleteRelationship:
    """Создать связь родитель-спортсмен"""
    db_relationship = models.ParentAthleteRelationship(**relationship.model_dump())
    db.add(db_relationship)
    await db.commit()
    await db.refresh(db_relationship)
    
    # Загрузить связанные объекты
    result = await db.execute(
        select(models.ParentAthleteRelationship)
        .where(models.ParentAthleteRelationship.id == db_relationship.id)
        .options(
            selectinload(models.ParentAthleteRelationship.parent),
            selectinload(models.ParentAthleteRelationship.athlete)
        )
    )
    return result.scalar_one()


async def get_parent_athlete_relationship(
    db: AsyncSession, 
    parent_id: int, 
    athlete_id: int
) -> Optional[models.ParentAthleteRelationship]:
    """Проверить существование связи родитель-спортсмен"""
    result = await db.execute(
        select(models.ParentAthleteRelationship)
        .where(
            models.ParentAthleteRelationship.parent_id == parent_id,
            models.ParentAthleteRelationship.athlete_id == athlete_id
        )
    )
    return result.scalars().first()


async def add_role_to_user(db: AsyncSession, user_id: int, role: schemas.UserRole, requesting_user_id: int = None) -> models.User:
    """Добавить роль к существующему пользователю с проверками"""
    # Проверить, что пользователь существует
    user = await get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    # Вычислить возраст пользователя
    today = date.today()
    user_age = today.year - user.birth_date.year
    if today.month < user.birth_date.month or (today.month == user.birth_date.month and today.day < user.birth_date.day):
        user_age -= 1
    
    # Проверки возраста для определенных ролей
    if role in [schemas.UserRole.parent, schemas.UserRole.coach] and user_age < 16:
        raise ValueError(f"Users under 16 cannot have {role.value} role")
    
    # Проверка прав для назначения роли тренера
    if role == schemas.UserRole.coach:
        if not requesting_user_id:
            raise ValueError("Coach role can only be assigned by head coach")
        
        requesting_user = await get_user(db, requesting_user_id)
        if not requesting_user or not requesting_user.is_head_coach:
            raise ValueError("Only head coach can assign coach role")
    
    # Проверить, что роль еще не добавлена
    existing_role = await db.execute(
        select(models.UserRoleAssignment)
        .where(
            models.UserRoleAssignment.user_id == user_id,
            models.UserRoleAssignment.role == role
        )
    )
    if existing_role.scalars().first():
        raise ValueError("User already has this role")
    
    # Добавить роль
    role_assignment = models.UserRoleAssignment(
        user_id=user_id,
        role=role
    )
    db.add(role_assignment)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_iin_for_login(db: AsyncSession, iin: str) -> Optional[models.User]:
    """Получить пользователя по IIN для входа (с загрузкой ролей)"""
    import logging
    logger = logging.getLogger(__name__)
    
    result = await db.execute(
        select(models.User)
        .where(models.User.iin == iin)
        .options(selectinload(models.User.user_roles))
    )
    user = result.scalars().first()
    
    if user:
        logger.info(f"User {user.id} ({user.full_name}) loaded with roles: {[ur.role for ur in user.user_roles]}")
        logger.info(f"User primary_role: {user.primary_role}")
    
    return user


async def user_has_role(db: AsyncSession, user_id: int, role: schemas.UserRole) -> bool:
    """Проверить, есть ли у пользователя указанная роль"""
    result = await db.execute(
        select(models.UserRoleAssignment)
        .where(
            models.UserRoleAssignment.user_id == user_id,
            models.UserRoleAssignment.role == role
        )
    )
    return result.scalars().first() is not None


async def make_head_coach(db: AsyncSession, user_id: int, requesting_user_id: int = None) -> models.User:
    """Назначить пользователя главным тренером"""
    user = await get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    # Проверить, что пользователь является тренером
    if not await user_has_role(db, user_id, schemas.UserRole.coach):
        raise ValueError("User must be a coach to become head coach")
    
    # Проверить права на назначение (может быть текущий главный тренер или первый тренер)
    if requesting_user_id:
        requesting_user = await get_user(db, requesting_user_id)
        if not requesting_user or not requesting_user.is_head_coach:
            raise ValueError("Only current head coach can assign new head coach")
    else:
        # Проверить, есть ли уже главный тренер в системе
        existing_head = await db.execute(
            select(models.User).where(models.User.is_head_coach == True)
        )
        if existing_head.scalars().first():
            raise ValueError("Head coach already exists. Current head coach must assign new one.")
    
    # Назначить главным тренером
    user.is_head_coach = True
    await db.commit()
    await db.refresh(user)
    return user


async def get_head_coach(db: AsyncSession) -> Optional[models.User]:
    """Получить главного тренера"""
    result = await db.execute(
        select(models.User)
        .where(models.User.is_head_coach == True)
        .options(selectinload(models.User.user_roles))
    )
    return result.scalars().first()


async def get_athletes_by_parent(db: AsyncSession, parent_id: int) -> List[models.User]:
    """Получить список детей-спортсменов для родителя"""
    result = await db.execute(
        select(models.User)
        .join(models.ParentAthleteRelationship, models.User.id == models.ParentAthleteRelationship.athlete_id)
        .where(models.ParentAthleteRelationship.parent_id == parent_id)
        .options(selectinload(models.User.user_roles))
    )
    return result.scalars().all()


async def get_coaches(db: AsyncSession) -> List[models.User]:
    """Получить список всех тренеров"""
    result = await db.execute(
        select(models.User)
        .join(models.UserRoleAssignment, models.User.id == models.UserRoleAssignment.user_id)
        .where(models.UserRoleAssignment.role == models.UserRole.coach)
        .options(selectinload(models.User.user_roles))
    )
    return result.scalars().all()

async def get_parents_by_athlete(db: AsyncSession, athlete_id: int) -> List[models.User]:
    """Получить список родителей для спортсмена"""
    result = await db.execute(
        select(models.User)
        .join(models.ParentAthleteRelationship, models.User.id == models.ParentAthleteRelationship.parent_id)
        .where(models.ParentAthleteRelationship.athlete_id == athlete_id)
        .options(selectinload(models.User.user_roles))
    )
    return result.scalars().all()