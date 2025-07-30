#!/usr/bin/env python3
"""
Script to add new data without deleting existing data
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
from app.users.models import User, UserRole, UserRoleAssignment
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest, IndividualTrainingStatus
from app.progress.models import Progress, Achievement, Tournament, TournamentParticipation, BeltLevel, TournamentLevel, TournamentStatus, ParticipationResult, AchievementType
from app.notifications.models import Notification, PushToken, NotificationTemplate
from app.merchandise.models import Product, ProductVariant, ProductCollection
from app.feedback.models import Feedback
from app.chat.models import ChatRoom, ChatMessage, ChatMembership, MessageReaction, ForumCategory, ForumTopic, ForumReply, ChatType, MessageType
from app.core.security import get_password_hash

# Sample data
FIRST_NAMES = [
    "Александр", "Дмитрий", "Михаил", "Артем", "Иван", "Максим", "Николай", "Сергей", "Андрей", "Владимир",
    "Анна", "Мария", "Елена", "Ольга", "Татьяна", "Наталья", "Ирина", "Екатерина", "Светлана", "Юлия"
]

LAST_NAMES = [
    "Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Попов", "Васильев", "Соколов", "Михайлов", "Новиков",
    "Иванова", "Петрова", "Сидорова", "Смирнова", "Кузнецова", "Попова", "Васильева", "Соколова", "Михайлова", "Новикова"
]

CITIES = ["Алматы", "Астана", "Шымкент", "Актобе", "Караганда", "Тараз", "Павлодар", "Усть-Каменогорск", "Семей", "Уральск"]

TOURNAMENT_NAMES = [
    "Кубок Алматы", "Чемпионат Казахстана", "Международный турнир", "Региональный чемпионат",
    "Турнир памяти", "Открытый чемпионат", "Кубок города", "Межклубный турнир"
]

CLASS_NAMES = [
    "Грэпплинг для начинающих", "Продвинутый грэпплинг", "Детская группа", "Юниорская группа",
    "Взрослая группа", "Женская группа", "Смешанная группа", "Индивидуальные тренировки"
]

PRODUCT_NAMES = [
    "Кимоно для грэпплинга", "Рашгард", "Шорты для грэпплинга", "Бандаж", "Тейп",
    "Сумка для спорта", "Бутылка для воды", "Полотенце", "Защита для ушей", "Защита для коленей"
]

async def add_tournaments(session):
    """Add tournaments if they don't exist"""
    print("Adding tournaments...")
    
    # Check if tournaments exist
    result = await session.execute(select(Tournament))
    existing_tournaments = result.scalars().all()
    
    if len(existing_tournaments) >= 5:
        print(f"Already have {len(existing_tournaments)} tournaments, skipping...")
        return existing_tournaments
    
    tournaments = []
    for i in range(8):
        event_date = datetime.utcnow() + timedelta(days=random.randint(30, 180))
        registration_start = event_date - timedelta(days=random.randint(30, 60))
        registration_end = event_date - timedelta(days=7)
        
        tournament = Tournament(
            name=random.choice(TOURNAMENT_NAMES) + f" {i+1}",
            description=f"Описание турнира {i+1}",
            location=random.choice(CITIES),
            tournament_level=random.choice([TournamentLevel.local, TournamentLevel.regional, TournamentLevel.national]),
            age_categories="10-12, 13-15, 16-18, взрослые",
            weight_categories="до 60кг, 60-70кг, 70+кг",
            belt_categories="белые-синие, фиолетовые+, открытая",
            registration_start=registration_start,
            registration_end=registration_end,
            event_date=event_date,
            status=random.choice([TournamentStatus.upcoming, TournamentStatus.ongoing, TournamentStatus.completed]),
            organizer="AIGA Grappling Club",
            contact_info="+7 777 123 4567",
            registration_fee=random.randint(5000, 15000),
            max_participants=random.randint(50, 200),
            current_participants=random.randint(0, 50),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(tournament)
        await session.flush()
        tournaments.append(tournament)
    
    await session.commit()
    print(f"Added {len(tournaments)} tournaments")
    return tournaments

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
                belt_level = random.choice([BeltLevel.white, BeltLevel.blue, BeltLevel.purple, BeltLevel.brown])
            
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
    
    # Get tournaments
    result = await session.execute(select(Tournament))
    tournaments = result.scalars().all()
    
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
            
            achievement = Achievement(
                athlete_id=athlete.id,
                progress_id=athlete.id,  # Assuming progress ID matches athlete ID
                achievement_type=achievement_type,
                title=title,
                description=description,
                tournament_id=random.choice(tournaments).id if achievement_type in [AchievementType.tournament_win, AchievementType.tournament_participation] and tournaments else None,
                belt_level=random.choice([BeltLevel.white, BeltLevel.blue, BeltLevel.purple, BeltLevel.brown, BeltLevel.black]) if achievement_type == AchievementType.belt_promotion else None,
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

async def add_chat_rooms(session):
    """Add chat rooms if they don't exist"""
    print("Adding chat rooms...")
    
    # Check if chat rooms exist
    result = await session.execute(select(ChatRoom))
    existing_rooms = result.scalars().all()
    
    if len(existing_rooms) >= 4:
        print(f"Already have {len(existing_rooms)} chat rooms, skipping...")
        return existing_rooms
    
    # Get head coach
    result = await session.execute(select(User).where(User.is_head_coach == True))
    head_coach = result.scalar_one_or_none()
    
    if not head_coach:
        print("No head coach found, skipping chat rooms...")
        return []
    
    chat_rooms = []
    room_data = [
        {
            "name": "Общий чат",
            "description": "Общий чат для всех участников клуба",
            "chat_type": ChatType.general,
            "is_active": True,
            "is_public": True,
            "max_members": 100,
            "is_moderated": True
        },
        {
            "name": "Чат родителей",
            "description": "Чат для родителей спортсменов",
            "chat_type": ChatType.parents,
            "is_active": True,
            "is_public": False,
            "max_members": 50,
            "is_moderated": True
        },
        {
            "name": "Чат спортсменов",
            "description": "Чат для спортсменов",
            "chat_type": ChatType.athletes,
            "is_active": True,
            "is_public": False,
            "max_members": 50,
            "is_moderated": True
        },
        {
            "name": "Чат тренеров",
            "description": "Чат для тренеров",
            "chat_type": ChatType.coaches,
            "is_active": True,
            "is_public": False,
            "max_members": 10,
            "is_moderated": False
        }
    ]
    
    for data in room_data:
        room = ChatRoom(
            **data,
            created_by_id=head_coach.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(room)
        await session.flush()
        chat_rooms.append(room)
    
    await session.commit()
    print(f"Added {len(chat_rooms)} chat rooms")
    return chat_rooms

async def add_products(session):
    """Add products if they don't exist"""
    print("Adding products...")
    
    # Check if products exist
    result = await session.execute(select(Product))
    existing_products = result.scalars().all()
    
    if len(existing_products) >= 5:
        print(f"Already have {len(existing_products)} products, skipping...")
        return existing_products
    
    products = []
    for i, name in enumerate(PRODUCT_NAMES):
        product = Product(
            name=name,
            description=f"Описание товара {name}",
            short_description=f"Краткое описание {name}",
            category="equipment",
            tags=["грэпплинг", "спорт", "экипировка"],
            price=random.randint(5000, 25000),
            original_price=random.randint(6000, 30000),
            currency="KZT",
            status="active",
            is_featured=random.choice([True, False]),
            main_image_url=f"https://example.com/images/{name.lower().replace(' ', '-')}.jpg",
            images=[f"https://example.com/images/{name.lower().replace(' ', '-')}-1.jpg"],
            has_variants=random.choice([True, False]),
            slug=f"product-{i+1}",
            meta_title=f"Купить {name}",
            meta_description=f"Описание товара {name}",
            external_url=None,
            sku=f"SKU-{i+1:03d}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(product)
        await session.flush()
        products.append(product)
    
    await session.commit()
    print(f"Added {len(products)} products")
    return products

async def add_notifications(session):
    """Add notifications"""
    print("Adding notifications...")
    
    # Get all users
    result = await session.execute(select(User))
    users = result.scalars().all()
    
    notification_data = [
        {
            "type": "booking_confirmed",
            "title": "Бронирование подтверждено",
            "message": "Ваше бронирование на занятие подтверждено"
        },
        {
            "type": "tournament_announcement",
            "title": "Новый турнир",
            "message": "Открыта регистрация на новый турнир"
        },
        {
            "type": "achievement_earned",
            "title": "Новое достижение",
            "message": "Поздравляем с новым достижением!"
        },
        {
            "type": "training_reminder",
            "title": "Напоминание о тренировке",
            "message": "Не забудьте о завтрашней тренировке"
        }
    ]
    
    notifications = []
    for user in users:
        # Create 1-3 notifications per user
        num_notifications = random.randint(1, 3)
        for i in range(num_notifications):
            data = random.choice(notification_data)
            notification = Notification(
                user_id=user.id,
                type=data["type"],
                title=data["title"],
                message=data["message"],
                priority="normal",
                data={},
                is_read=random.choice([True, False]),
                is_sent=True,
                sent_at=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            session.add(notification)
            await session.flush()
            notifications.append(notification)
    
    await session.commit()
    print(f"Added {len(notifications)} notifications")
    return notifications

async def main():
    """Main function to add data"""
    async with AsyncSessionLocal() as session:
        try:
            print("Starting to add data to database...")
            
            # Add tournaments
            tournaments = await add_tournaments(session)
            
            # Add progress records
            progress_records = await add_progress_records(session)
            
            # Add achievements
            achievements = await add_achievements(session)
            
            # Add chat rooms
            chat_rooms = await add_chat_rooms(session)
            
            # Add products
            products = await add_products(session)
            
            # Add notifications
            notifications = await add_notifications(session)
            
            print("Data addition completed successfully!")
            print(f"\nSummary:")
            print(f"- Tournaments: {len(tournaments)}")
            print(f"- Progress records: {len(progress_records)}")
            print(f"- Achievements: {len(achievements)}")
            print(f"- Chat rooms: {len(chat_rooms)}")
            print(f"- Products: {len(products)}")
            print(f"- Notifications: {len(notifications)}")
            
        except Exception as e:
            print(f"Error during data addition: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    print("Starting data addition...")
    asyncio.run(main())
    print("Data addition completed!") 