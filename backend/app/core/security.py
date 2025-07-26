from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Union
from app.config import settings


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 7)  # 7 дней по умолчанию

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})  # Помечаем тип токена
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Создать refresh токен с длительным сроком действия"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})  # Помечаем как refresh токен
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Проверяем что это именно access токен
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> dict:
    """Проверить и декодировать refresh токен"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Проверяем что это именно refresh токен
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        # Токен истёк - возвращаем специальный код
        return {"error": "token_expired"}
    except JWTError:
        # Токен невалидный (подделан, неправильный формат и т.д.)
        return {"error": "invalid_token"}


def refresh_access_token(refresh_token: str) -> Union[str, None]:
    """Создать новый access токен используя refresh токен"""
    payload = decode_refresh_token(refresh_token)
    if not payload:
        return None
    
    # Проверяем на ошибки
    if "error" in payload:
        return payload  # Возвращаем ошибку для обработки выше
    
    # Создаём новый access токен с теми же данными
    new_token_data = {
        "sub": payload.get("sub"),
        "role": payload.get("role"), 
        "user_id": payload.get("user_id")
    }
    return create_access_token(new_token_data)