#!/usr/bin/env python3
"""
Script to clear database and seed with fresh data
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import AsyncSessionLocal
from seed_data import main

async def clear_database():
    """Clear all data from database"""
    async with AsyncSessionLocal() as session:
        try:
            print("Clearing database...")
            
            # Delete in reverse order of dependencies
            tables_to_clear = [
                "notifications",
                "message_reactions", 
                "chat_messages",
                "chat_memberships",
                "chat_rooms",
                "forum_replies",
                "forum_topics", 
                "forum_categories",
                "achievements",
                "tournament_participations",
                "tournaments",
                "progress",
                "individual_training_requests",
                "bookings",
                "classes",
                "user_role_assignments",
                "users"
            ]
            
            for table in tables_to_clear:
                print(f"Clearing table: {table}")
                await session.execute(text(f"DELETE FROM {table}"))
            
            await session.commit()
            print("Database cleared successfully!")
            
        except Exception as e:
            print(f"Error clearing database: {e}")
            await session.rollback()
            raise

async def main_clear_and_seed():
    """Clear database and seed with fresh data"""
    try:
        # Clear database
        await clear_database()
        
        # Seed database
        await main()
        
        print("Database cleared and seeded successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    print("Starting database clear and seed...")
    asyncio.run(main_clear_and_seed())
    print("Clear and seed completed!") 