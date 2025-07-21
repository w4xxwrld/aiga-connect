from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    iin: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)