from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ThreadBase(BaseModel):
    title: str
    content: str
    category_id: Optional[int]

class ThreadCreate(ThreadBase):
    pass

class ThreadResponse(ThreadBase):
    id: int
    created_by_id: int
    created_at: datetime
    replies_count: int = 0

    class Config:
        orm_mode = True

class ReplyBase(BaseModel):
    content: str
    thread_id: int

class ReplyCreate(ReplyBase):
    pass

class ReplyResponse(ReplyBase):
    id: int
    author_id: int
    created_at: datetime

    class Config:
        orm_mode = True
