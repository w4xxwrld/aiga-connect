from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.feedback import crud, schemas
from app.deps import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.FeedbackResponse)
async def post_feedback(
    feedback: schemas.FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud.create_feedback(db, feedback, current_user.id)

@router.get("/trainer/{trainer_id}", response_model=List[schemas.FeedbackResponse])
async def get_trainer_feedback(
    trainer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud.get_feedback_for_trainer(db, trainer_id)
