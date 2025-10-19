from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.deps import get_db, get_current_user
from app.users import schemas, crud
from app.users.models import User, UserRole, UserRoleAssignment
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token

router = APIRouter()

@router.post("/", response_model=schemas.UserOut)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if await crud.get_user_by_iin(db, user.iin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IIN already registered",
        )

    db_user = await crud.create_user(db, user)
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await crud.authenticate_user(db, login_data.iin, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid IIN or password"
        )
    
    # Create JWT tokens with user info
    token_data = {"sub": user.iin, "role": user.primary_role.value, "user_id": user.id}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_data: schemas.RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Обновить access токен используя refresh токен"""
    payload = decode_refresh_token(refresh_data.refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Проверяем специальные ошибки
    if "error" in payload:
        if payload["error"] == "token_expired":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired. Please login again.",
                headers={"X-Token-Expired": "true"}  # Специальный заголовок для фронтенда
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    # Проверяем что пользователь ещё существует
    user = await crud.get_user(db, payload.get("user_id"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Создаём новые токены с актуальными данными пользователя
    token_data = {"sub": user.iin, "role": user.primary_role.value, "user_id": user.id}
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=schemas.UserOut)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о текущем пользователе"""
    print(f"DEBUG: User {current_user.id} ({current_user.full_name}) - is_head_coach: {current_user.is_head_coach}")
    return current_user

@router.post("/add-role", response_model=schemas.UserOut)
async def add_role_to_current_user(
    role_request: schemas.AddRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Добавить роль к текущему пользователю или другому пользователю (для главного тренера)"""
    try:
        # Определить целевого пользователя
        target_user_id = role_request.target_user_id or current_user.id
        
        # Если пользователь назначает роль не себе, проверить права главного тренера
        if target_user_id != current_user.id:
            if not current_user.is_head_coach:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only head coach can assign roles to other users"
                )
        
        # Проверить, что пользователь не пытается назначить роль тренера самому себе
        if role_request.role == UserRole.coach and target_user_id == current_user.id:
            if not current_user.is_head_coach:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only head coach can assign coach role"
                )
        
        updated_user = await crud.add_role_to_user(
            db, 
            target_user_id, 
            role_request.role, 
            current_user.id
        )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/create-head-coach", response_model=schemas.UserOut)
async def create_head_coach(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Создать главного тренера (только если его еще нет в системе)"""
    # Проверить, что главного тренера еще нет в системе
    existing_head_coach = await crud.get_head_coach(db)
    if existing_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Head coach already exists in the system"
        )
    
    # Принудительно установить роль coach и флаг head coach
    user.primary_role = UserRole.coach
    user.is_head_coach = True
    user.additional_roles = []
    
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if await crud.get_user_by_iin(db, user.iin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IIN already registered",
        )

    db_user = await crud.create_user(db, user)
    return db_user

@router.post("/make-head-coach/{user_id}", response_model=schemas.UserOut)
async def make_user_head_coach(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Назначить тренера главным тренером (только для текущего главного тренера)"""
    try:
        updated_user = await crud.make_head_coach(db, user_id, current_user.id)
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/head-coach", response_model=schemas.UserOut)
async def get_head_coach_info(db: AsyncSession = Depends(get_db)):
    """Получить информацию о главном тренере"""
    head_coach = await crud.get_head_coach(db)
    if not head_coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Head coach not found"
        )
    return head_coach

@router.get("/coaches", response_model=List[schemas.UserSimple])
async def get_coaches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список всех тренеров"""
    coaches = await crud.get_coaches(db)
    return coaches

@router.get("/all", response_model=List[schemas.UserOut])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить всех пользователей (только для главных тренеров)"""
    if not current_user.is_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only head coaches can view all users"
        )
    
    users = await crud.get_all_users(db)
    return users


@router.post("/{user_id}/make-coach", response_model=schemas.UserOut)
async def make_user_coach(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Назначить пользователя тренером (только для главных тренеров)"""
    if not current_user.is_head_coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only head coaches can assign coach role"
        )
    
    try:
        user = await crud.make_user_coach(db, user_id, current_user.id)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

