#!/usr/bin/env python3
"""
Script to add test feedback data
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.feedback.models import Feedback
from app.users.models import User

async def add_test_feedback():
    """Add test feedback data"""
    async with AsyncSessionLocal() as session:
        try:
            print("Adding test feedback data...")
            
            # Get some users to create feedback for
            result = await session.execute(select(User).limit(5))
            users = result.scalars().all()
            
            if len(users) < 2:
                print("Not enough users found. Need at least 2 users.")
                return
            
            # Get coaches (users with coach role)
            coaches_result = await session.execute(
                select(User).where(User.primary_role == "coach")
            )
            coaches = coaches_result.scalars().all()
            
            if not coaches:
                print("No coaches found. Creating feedback for regular users...")
                coaches = users[:2]  # Use first 2 users as coaches for testing
            
            # Create some test feedback
            test_feedback = [
                {
                    "author_id": users[0].id,
                    "trainer_id": coaches[0].id,
                    "rating": 5,
                    "comment": "Отличный тренер! Очень внимательный и профессиональный."
                },
                {
                    "author_id": users[1].id if len(users) > 1 else users[0].id,
                    "trainer_id": coaches[0].id,
                    "rating": 4,
                    "comment": "Хороший тренер, объясняет понятно."
                },
                {
                    "author_id": users[0].id,
                    "trainer_id": coaches[1].id if len(coaches) > 1 else coaches[0].id,
                    "rating": 5,
                    "comment": "Превосходный тренер! Рекомендую всем."
                }
            ]
            
            for feedback_data in test_feedback:
                # Check if feedback already exists
                existing = await session.execute(
                    select(Feedback).where(
                        Feedback.author_id == feedback_data["author_id"],
                        Feedback.trainer_id == feedback_data["trainer_id"]
                    )
                )
                
                if not existing.scalars().first():
                    feedback = Feedback(**feedback_data)
                    session.add(feedback)
                    print(f"Added feedback from user {feedback_data['author_id']} for trainer {feedback_data['trainer_id']}")
                else:
                    print(f"Feedback already exists for user {feedback_data['author_id']} and trainer {feedback_data['trainer_id']}")
            
            await session.commit()
            print("Test feedback data added successfully!")
            
        except Exception as e:
            print(f"Error adding test feedback: {e}")
            await session.rollback()
            raise

async def main():
    """Main function"""
    try:
        await add_test_feedback()
    except Exception as e:
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    print("Adding test feedback data...")
    asyncio.run(main())
    print("Done!") 