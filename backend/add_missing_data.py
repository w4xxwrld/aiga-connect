#!/usr/bin/env python3
"""
Simple script to add missing progress records and achievements
"""

import asyncio
import sys
import os
import random
from datetime import datetime, timedelta, date

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.users.models import User, UserRole
from app.progress.models import Progress, Achievement, BeltLevel, AchievementType
from app.classes.models import Class
from app.bookings.models import Booking
from app.chat.models import ChatRoom, ChatMessage
from app.merchandise.models import Product
from app.notifications.models import Notification

async def add_progress_records(session):
    """Add progress records for athletes who don't have them"""
    print("Adding progress records...")
    
    # Get all athletes
    result = await session.execute(select(User).where(User.primary_role == UserRole.athlete))
    athletes = result.scalars().all()
    
    # Get existing progress records
    result = await session.execute(select(Progress))
    existing_progress = result.scalars().all()
    existing_athlete_ids = {p.athlete_id for p in existing_progress}
    
    progress_records = []
    for athlete in athletes:
        if athlete.id not in existing_athlete_ids:
            # Calculate age
            age = (datetime.utcnow().date() - athlete.birth_date).days // 365
            
            # Determine belt level based on age and random progression
            if age < 16:
                belt_level = random.choice([BeltLevel.white, BeltLevel.yellow, BeltLevel.orange, BeltLevel.green])
            else:
                belt_level = random.choice([BeltLevel.white, BeltLevel.blue, BeltLevel.brown, BeltLevel.black])
            
            stripes = random.randint(0, 4)
            
            progress = Progress(
                athlete_id=athlete.id,
                current_belt=belt_level,
                current_stripes=stripes,
                total_classes_attended=random.randint(10, 100),
                total_tournaments_participated=random.randint(0, 8),
                total_wins=random.randint(0, 20),
                total_losses=random.randint(0, 15),
                belt_received_date=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                last_promotion_date=datetime.utcnow() - timedelta(days=random.randint(0, 180)),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(progress)
            await session.flush()
            progress_records.append(progress)
    
    await session.commit()
    print(f"Added {len(progress_records)} progress records")
    return progress_records

async def add_achievements(session):
    """Add achievements for athletes"""
    print("Adding achievements...")
    
    # Get all athletes
    result = await session.execute(select(User).where(User.primary_role == UserRole.athlete))
    athletes = result.scalars().all()
    
    # Get progress records to map athlete_id to progress_id
    result = await session.execute(select(Progress))
    progress_records = result.scalars().all()
    athlete_to_progress = {p.athlete_id: p.id for p in progress_records}
    
    achievements = []
    for athlete in athletes:
        # Create 2-5 achievements per athlete
        num_achievements = random.randint(2, 5)
        for i in range(num_achievements):
            achievement_type = random.choice([
                AchievementType.belt_promotion,
                AchievementType.tournament_win,
                AchievementType.tournament_participation,
                AchievementType.attendance_milestone,
                AchievementType.technique_mastery
            ])
            
            if achievement_type == AchievementType.belt_promotion:
                title = "Повышение пояса"
                description = "Получен новый пояс"
            elif achievement_type == AchievementType.tournament_win:
                title = "Победа на турнире"
                description = "Занял первое место"
            elif achievement_type == AchievementType.tournament_participation:
                title = "Участие в турнире"
                description = "Успешно участвовал в турнире"
            elif achievement_type == AchievementType.attendance_milestone:
                title = "Милстоун посещений"
                description = "Достиг определенного количества занятий"
            else:
                title = "Мастерство техники"
                description = "Освоил новую технику"
            
            # Skip if athlete doesn't have a progress record
            if athlete.id not in athlete_to_progress:
                continue
                
            achievement = Achievement(
                athlete_id=athlete.id,
                progress_id=athlete_to_progress[athlete.id],
                achievement_type=achievement_type,
                title=title,
                description=description,
                tournament_id=None,  # No tournament reference for now
                belt_level=random.choice([BeltLevel.white, BeltLevel.yellow, BeltLevel.orange, BeltLevel.green, BeltLevel.blue, BeltLevel.brown, BeltLevel.black]) if achievement_type == AchievementType.belt_promotion else None,
                points_earned=random.randint(10, 100),
                is_public=True,
                achieved_date=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
                created_at=datetime.utcnow()
            )
            session.add(achievement)
            await session.flush()
            achievements.append(achievement)
    
    await session.commit()
    print(f"Added {len(achievements)} achievements")
    return achievements

async def main():
    """Main function to add missing data"""
    async with AsyncSessionLocal() as session:
        try:
            print("Starting to add missing data...")
            
            # Add progress records
            progress_records = await add_progress_records(session)
            
            # Add achievements
            achievements = await add_achievements(session)
            
            print("Data addition completed successfully!")
            print(f"\nSummary:")
            print(f"- Progress records: {len(progress_records)}")
            print(f"- Achievements: {len(achievements)}")
            
        except Exception as e:
            print(f"Error during data addition: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    print("Starting missing data addition...")
    asyncio.run(main())
    print("Missing data addition completed!") 