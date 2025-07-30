from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class FeedbackBase(BaseModel):
    trainer_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str]

class FeedbackCreate(FeedbackBase):
    pass

from typing import Union
from pydantic import field_validator

class FeedbackResponse(FeedbackBase):
    id: int
    author_id: int
    author: dict  # Will contain author info with full_name, email, etc.
    created_at: datetime

    class Config:
        from_attributes = True
        
    @field_validator('author', mode='before')
    @classmethod
    def validate_author(cls, v):
        if hasattr(v, 'id'):  # It's a User object
            return {
                'id': v.id,
                'full_name': v.full_name,
                'email': v.email
            }
        return v
