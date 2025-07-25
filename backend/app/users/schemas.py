from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, datetime
from app.users.models import UserRole, RelationshipType

class UserBase(BaseModel):
    iin: str
    full_name: str  # Обязательное поле
    email: EmailStr  # Обязательное поле
    phone: Optional[str] = None
    birth_date: date  # Обязательное поле
    emergency_contact: Optional[str] = None
    primary_role: UserRole  # Основная роль
    is_head_coach: bool = False  # Флаг главного тренера

    @field_validator("iin")
    @classmethod
    def validate_iin(cls, v):
        if len(v) != 12 or not v.isdigit():
            raise ValueError("IIN must be exactly 12 digits")
        return v
    
    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError("Birth date cannot be in the future")
        return v
    
    def get_age(self) -> int:
        """Вычислить возраст в годах"""
        today = date.today()
        age = today.year - self.birth_date.year
        if today.month < self.birth_date.month or (today.month == self.birth_date.month and today.day < self.birth_date.day):
            age -= 1
        return age

class UserCreate(UserBase):
    password: str
    additional_roles: Optional[List[UserRole]] = []  # Дополнительные роли при регистрации

    @field_validator("primary_role")
    @classmethod
    def validate_primary_role_age(cls, v, info):
        """Проверить возрастные ограничения для основной роли"""
        if hasattr(info, 'data') and info.data:
            birth_date = info.data.get('birth_date')
            if birth_date:
                from datetime import date
                today = date.today()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1
                
                if v in [UserRole.parent, UserRole.coach] and age < 16:
                    raise ValueError(f"Users under 16 cannot have {v.value} role")
        return v

    @field_validator("additional_roles")
    @classmethod
    def validate_additional_roles_age(cls, v, info):
        """Проверить возрастные ограничения для дополнительных ролей"""
        if hasattr(info, 'data') and info.data and v:
            birth_date = info.data.get('birth_date')
            if birth_date:
                from datetime import date
                today = date.today()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1
                
                restricted_roles = [UserRole.parent, UserRole.coach]
                for role in v:
                    if role in restricted_roles and age < 16:
                        raise ValueError(f"Users under 16 cannot have {role.value} role")
        return v

    @field_validator("is_head_coach")
    @classmethod  
    def validate_head_coach(cls, v, info):
        """Только тренеры могут быть главными тренерами"""
        if v and hasattr(info, 'data') and info.data:
            primary_role = info.data.get('primary_role')
            additional_roles = info.data.get('additional_roles', [])
            
            is_coach = primary_role == UserRole.coach or UserRole.coach in additional_roles
            if not is_coach:
                raise ValueError("Only coaches can be head coaches")
        return v

    @field_validator("emergency_contact")
    @classmethod
    def validate_emergency_contact_for_minors(cls, v, info):
        """Для спортсменов младше 16 лет emergency_contact обязателен"""
        if hasattr(info, 'data') and info.data:
            primary_role = info.data.get('primary_role')
            additional_roles = info.data.get('additional_roles', [])
            birth_date = info.data.get('birth_date')
            
            # Проверяем, есть ли роль athlete среди ролей
            is_athlete = primary_role == UserRole.athlete or UserRole.athlete in additional_roles
            
            if is_athlete and birth_date:
                # Вычисляем возраст
                from datetime import date
                today = date.today()
                age = today.year - birth_date.year
                if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                    age -= 1
                
                if age < 16 and not v:
                    raise ValueError("Для спортсменов младше 16 лет контакт родителя/опекуна обязателен")
        
        return v

class UserOut(UserBase):
    id: int
    roles: List[UserRole] = []  # Все роли пользователя
    created_at: datetime

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Если obj это SQLAlchemy объект, извлекаем роли
        if hasattr(obj, 'user_roles'):
            roles = [ur.role for ur in obj.user_roles]
            # Создаем dict с данными
            data = {
                'id': obj.id,
                'iin': obj.iin,
                'full_name': obj.full_name,
                'email': obj.email,
                'phone': obj.phone,
                'birth_date': obj.birth_date,
                'emergency_contact': obj.emergency_contact,
                'primary_role': obj.primary_role,
                'is_head_coach': obj.is_head_coach,
                'created_at': obj.created_at,
                'roles': roles
            }
            return super().model_validate(data, **kwargs)
        return super().model_validate(obj, **kwargs)

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    iin: str
    password: str

class AddRoleRequest(BaseModel):
    role: UserRole
    target_user_id: Optional[int] = None  # Для админов, чтобы назначать роли другим пользователям

    @field_validator("role")
    @classmethod
    def validate_role_assignment(cls, v):
        """Валидация назначения ролей"""
        # Все роли можно назначать через API
        return v

# Parent-Athlete Relationship schemas
class ParentAthleteRelationshipBase(BaseModel):
    parent_id: int
    athlete_id: int
    relationship_type: RelationshipType

class ParentAthleteRelationshipCreate(ParentAthleteRelationshipBase):
    pass

class ParentAthleteRelationshipOut(ParentAthleteRelationshipBase):
    id: int
    created_at: datetime
    parent: UserOut
    athlete: UserOut

    model_config = ConfigDict(from_attributes=True)

# JWT token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str  # Добавляем refresh токен
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    iin: Optional[str] = None
    role: Optional[str] = None