from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.users import crud
from app.users.schemas import UserRole

# Database dependency
async def get_db():
    async with AsyncSessionLocal() as session:  
        yield session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        iin: str = payload.get("sub")
        if iin is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await crud.get_user_by_iin_for_login(db, iin)
    if user is None:
        raise credentials_exception
    return user

def get_current_user_by_role(required_role: UserRole):
    async def role_checker(
        user=Depends(get_current_user)
    ):
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return role_checker

# Асинхронная функция аутентификации для WebSocket
async def get_current_user_websocket(token: str):
    """Authenticate user for WebSocket connections"""
    try:
        payload = decode_access_token(token)
        if payload is None:
            return None
        iin: str = payload.get("sub")
        if iin is None:
            return None
    except JWTError:
        return None

    # Создаем асинхронную сессию для WebSocket
    async with AsyncSessionLocal() as db:
        user = await crud.get_user_by_iin_for_login(db, iin)
        return user