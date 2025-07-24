from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from app.users.models import UserRole 

class UserBase(BaseModel):
    iin: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.parent

    @field_validator("iin")
    @classmethod
    def validate_iin(cls, v):
        if len(v) != 12 or not v.isdigit():
            raise ValueError("IIN must be exactly 12 digits")
        return v

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    iin: str
    password: str

# JWT token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    iin: Optional[str] = None
    role: Optional[str] = None