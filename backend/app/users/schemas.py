from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional


class UserBase(BaseModel):
    iin: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

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