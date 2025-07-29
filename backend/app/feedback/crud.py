from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.feedback.models import Feedback
from app.feedback.schemas import FeedbackCreate

async def create_feedback(db: AsyncSession, feedback_data: FeedbackCreate, author_id: int) -> Feedback:
    db_feedback = Feedback(
        author_id=author_id,
        **feedback_data.model_dump()
    )
    db.add(db_feedback)
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

async def get_feedback_for_trainer(db: AsyncSession, trainer_id: int) -> List[Feedback]:
    result = await db.execute(
        select(Feedback).where(Feedback.trainer_id == trainer_id)
    )
    return result.scalars().all()

async def get_feedback_by_author(db: AsyncSession, author_id: int) -> List[Feedback]:
    result = await db.execute(
        select(Feedback).where(Feedback.author_id == author_id)
    )
    return result.scalars().all()
