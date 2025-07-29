from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class FeedbackBase(BaseModel):
    trainer_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str]

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase):
    id: int
    author_id: int
    created_at: datetime

    class Config:
        orm_mode = True
