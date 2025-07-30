from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.feedback.models import Feedback
from app.feedback.schemas import FeedbackCreate
from app.users.models import User

async def create_feedback(db: AsyncSession, feedback_data: FeedbackCreate, author_id: int) -> Feedback:
    try:
        db_feedback = Feedback(
            author_id=author_id,
            **feedback_data.model_dump()
        )
        db.add(db_feedback)
        await db.commit()
        await db.refresh(db_feedback)
        
        # Load the author relationship
        await db.refresh(db_feedback, ['author'])
        
        return db_feedback
    except Exception as e:
        await db.rollback()
        print(f"Error creating feedback: {e}")
        raise

async def get_feedback_for_trainer(db: AsyncSession, trainer_id: int) -> List[Feedback]:
    result = await db.execute(
        select(Feedback)
        .options(selectinload(Feedback.author))
        .where(Feedback.trainer_id == trainer_id)
        .order_by(Feedback.created_at.desc())
    )
    feedbacks = result.scalars().all()
    
    return feedbacks

async def get_feedback_by_author(db: AsyncSession, author_id: int) -> List[Feedback]:
    result = await db.execute(
        select(Feedback).where(Feedback.author_id == author_id)
    )
    return result.scalars().all()
