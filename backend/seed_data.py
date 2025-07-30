#!/usr/bin/env python3
"""
Database Seeding Script for AIGA Connect
Populates all tables with realistic fake data and working relationships
"""

import asyncio
import random
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
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
from enum import Enum

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

async def create_users(session: AsyncSession):
    """Create users with different roles"""
    users = []
    
    # Create head coach
    head_coach = User(
        iin="123456789012",
        full_name="Александр Петров",
        email="headcoach@aiga.kz",
        hashed_password=get_password_hash("password123"),
        phone="+7 777 123 4567",
        birth_date=date(1985, 5, 15),
        emergency_contact="+7 777 123 4568",
        primary_role=UserRole.coach,
        is_head_coach=True,
        created_at=datetime.utcnow()
    )
    session.add(head_coach)
    await session.flush()
    users.append(head_coach)
    
    # Create regular coaches
    for i in range(3):
        coach = User(
            iin=f"12345678901{i+3}",
            full_name=f"{FIRST_NAMES[i+1]} {LAST_NAMES[i+1]}",
            email=f"coach{i+1}@aiga.kz",
            hashed_password=get_password_hash("password123"),
            phone=f"+7 777 123 456{i+8}",
            birth_date=date(1990 + i, 3 + i, 10 + i),
            emergency_contact=f"+7 777 123 456{i+9}",
            primary_role=UserRole.coach,
            is_head_coach=False,
            created_at=datetime.utcnow()
        )
        session.add(coach)
        await session.flush()
        users.append(coach)
    
    # Create parents
    for i in range(5):
        parent = User(
            iin=f"12345678902{i}",
            full_name=f"{FIRST_NAMES[i+5]} {LAST_NAMES[i+5]}",
            email=f"parent{i+1}@mail.ru",
            hashed_password=get_password_hash("password123"),
            phone=f"+7 777 123 457{i}",
            birth_date=date(1980 + i, 2 + i, 5 + i),
            emergency_contact=f"+7 777 123 458{i}",
            primary_role=UserRole.parent,
            is_head_coach=False,
            created_at=datetime.utcnow()
        )
        session.add(parent)
        await session.flush()
        users.append(parent)
    
    # Create athletes (children)
    for i in range(15):
        athlete = User(
            iin=f"12345678903{i}",
            full_name=f"{FIRST_NAMES[i+10]} {LAST_NAMES[i+10]}",
            email=f"athlete{i+1}@mail.ru",
            hashed_password=get_password_hash("password123"),
            phone=f"+7 777 123 459{i}",
            birth_date=date(2010 + (i % 8), 1 + (i % 12), 1 + (i % 28)),
            emergency_contact=f"+7 777 123 460{i}",
            primary_role=UserRole.athlete,
            is_head_coach=False,
            created_at=datetime.utcnow()
        )
        session.add(athlete)
        await session.flush()
        users.append(athlete)
    
    await session.commit()
    return users

async def create_user_roles(session: AsyncSession, users: list):
    """Assign roles to users"""
    role_assignments = []
    
    # Head coach already has coach role
    head_coach = users[0]
    role_assignments.append(UserRoleAssignment(
        user_id=head_coach.id,
        role=UserRole.coach,
        created_at=datetime.utcnow()
    ))
    
    # Regular coaches
    for i in range(1, 4):
        role_assignments.append(UserRoleAssignment(
            user_id=users[i].id,
            role=UserRole.coach,
            created_at=datetime.utcnow()
        ))
    
    # Parents
    for i in range(4, 9):
        role_assignments.append(UserRoleAssignment(
            user_id=users[i].id,
            role=UserRole.parent,
            created_at=datetime.utcnow()
        ))
    
    # Athletes
    for i in range(9, 24):
        role_assignments.append(UserRoleAssignment(
            user_id=users[i].id,
            role=UserRole.athlete,
            created_at=datetime.utcnow()
        ))
    
    for assignment in role_assignments:
        session.add(assignment)
    
    await session.commit()

async def create_classes(session: AsyncSession, coaches: list):
    """Create classes with coaches"""
    classes = []
    
    class_data = [
        {
            "name": "Грэпплинг для начинающих",
            "description": "Базовые техники грэпплинга для новичков",
            "difficulty_level": "beginner",
            "day_of_week": "Понедельник",
            "start_time": "18:00",
            "end_time": "19:30",
            "age_group_min": 8,
            "age_group_max": 16,
            "max_capacity": 15,
            "price_per_class": 5000,
            "status": "active",
            "is_trial_available": True
        },
        {
            "name": "Продвинутый грэпплинг",
            "description": "Продвинутые техники для опытных спортсменов",
            "difficulty_level": "advanced",
            "day_of_week": "Вторник",
            "start_time": "19:00",
            "end_time": "20:30",
            "age_group_min": 14,
            "age_group_max": 25,
            "max_capacity": 12,
            "price_per_class": 7000,
            "status": "active",
            "is_trial_available": False
        },
        {
            "name": "Детская группа",
            "description": "Специальная программа для детей 6-12 лет",
            "difficulty_level": "beginner",
            "day_of_week": "Среда",
            "start_time": "16:00",
            "end_time": "17:00",
            "age_group_min": 6,
            "age_group_max": 12,
            "max_capacity": 10,
            "price_per_class": 4000,
            "status": "active",
            "is_trial_available": True
        },
        {
            "name": "Женская группа",
            "description": "Грэпплинг для женщин",
            "difficulty_level": "intermediate",
            "day_of_week": "Четверг",
            "start_time": "18:30",
            "end_time": "20:00",
            "age_group_min": 16,
            "age_group_max": 50,
            "max_capacity": 8,
            "price_per_class": 6000,
            "status": "active",
            "is_trial_available": True
        }
    ]
    
    for i, data in enumerate(class_data):
        class_obj = Class(
            **data,
            coach_id=coaches[i % len(coaches)].id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(class_obj)
        await session.flush()
        classes.append(class_obj)
    
    await session.commit()
    return classes

async def create_bookings(session: AsyncSession, users: list, classes: list):
    """Create bookings for athletes"""
    bookings = []
    
    athletes = [u for u in users if u.primary_role == UserRole.athlete]
    parents = [u for u in users if u.primary_role == UserRole.parent]
    
    for i, athlete in enumerate(athletes):
        # Create 2-4 bookings per athlete
        num_bookings = random.randint(2, 4)
        for j in range(num_bookings):
            class_obj = random.choice(classes)
            booking_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            class_date = datetime.utcnow() + timedelta(days=random.randint(1, 60))
            
            # 70% chance parent booked for child
            booked_by_parent = random.choice(parents) if random.random() < 0.7 else None
            
            booking = Booking(
                athlete_id=athlete.id,
                class_id=class_obj.id,
                booked_by_parent_id=booked_by_parent.id if booked_by_parent else None,
                booking_type=random.choice(["regular", "trial", "makeup"]),
                status=random.choice(["pending", "confirmed", "cancelled"]),
                booking_date=booking_date,
                class_date=class_date,
                is_paid=random.choice([True, False]),
                payment_amount=class_obj.price_per_class if random.random() < 0.8 else None,
                notes=f"Заметка для бронирования {j+1}" if random.random() < 0.3 else None,
                cancellation_reason="Отменено пользователем" if random.random() < 0.1 else None,
                created_at=booking_date,
                updated_at=booking_date
            )
            session.add(booking)
            await session.flush()
            bookings.append(booking)
    
    await session.commit()
    return bookings

async def create_progress(session: AsyncSession, users: list):
    """Create progress records for athletes"""
    progress_records = []
    
    athletes = [u for u in users if u.primary_role == UserRole.athlete]
    
    for athlete in athletes:
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
    return progress_records

async def create_tournaments(session: AsyncSession):
    """Create tournaments"""
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
    return tournaments

async def create_tournament_participations(session: AsyncSession, users: list, tournaments: list):
    """Create tournament participations"""
    participations = []
    
    athletes = [u for u in users if u.primary_role == UserRole.athlete]
    
    for tournament in tournaments:
        # 30-70% of athletes participate in each tournament
        num_participants = random.randint(len(athletes) // 3, len(athletes) // 2)
        tournament_athletes = random.sample(athletes, num_participants)
        
        for athlete in tournament_athletes:
            participation = TournamentParticipation(
                tournament_id=tournament.id,
                athlete_id=athlete.id,
                age_category=random.choice(["10-12", "13-15", "16-18", "взрослые"]),
                weight_category=random.choice(["до 60кг", "60-70кг", "70+кг"]),
                belt_category=random.choice(["белые-синие", "фиолетовые+", "открытая"]),
                result=random.choice([ParticipationResult.first_place, ParticipationResult.second_place, ParticipationResult.third_place, ParticipationResult.participated]),
                final_position=random.randint(1, 8) if random.random() < 0.3 else None,
                registration_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                is_paid=random.choice([True, False]),
                notes=f"Заметка для участия {athlete.id}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(participation)
            await session.flush()
            participations.append(participation)
    
    await session.commit()
    return participations

async def create_achievements(session: AsyncSession, users: list, tournaments: list):
    """Create achievements for athletes"""
    achievements = []
    
    athletes = [u for u in users if u.primary_role == UserRole.athlete]
    
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
                tournament_id=random.choice(tournaments).id if achievement_type in [AchievementType.tournament_win, AchievementType.tournament_participation] else None,
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
    return achievements

async def create_chat_rooms(session: AsyncSession, users: list):
    """Create chat rooms"""
    chat_rooms = []
    
    head_coach = users[0]
    
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
    return chat_rooms

async def create_chat_messages(session: AsyncSession, users: list, chat_rooms: list):
    """Create chat messages"""
    messages = []
    
    message_texts = [
        "Привет всем!",
        "Как дела?",
        "Когда следующая тренировка?",
        "Отличная работа сегодня!",
        "Кто идет на турнир?",
        "Поздравляю с победой!",
        "Нужна помощь с техникой",
        "Спасибо за тренировку",
        "До встречи на следующем занятии",
        "Удачи на соревнованиях!"
    ]
    
    for room in chat_rooms:
        # Create 5-15 messages per room
        num_messages = random.randint(5, 15)
        for i in range(num_messages):
            sender = random.choice(users)
            message = ChatMessage(
                room_id=room.id,
                sender_id=sender.id,
                message_type=MessageType.text,
                content=random.choice(message_texts),
                is_edited=False,
                is_deleted=False,
                is_pinned=False,
                is_approved=True,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                updated_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            session.add(message)
            await session.flush()
            messages.append(message)
    
    await session.commit()
    return messages

async def create_products(session: AsyncSession):
    """Create products for the store"""
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
    return products

async def create_notifications(session: AsyncSession, users: list):
    """Create notifications"""
    notifications = []
    
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
    return notifications

async def main():
    """Main seeding function"""
    async with AsyncSessionLocal() as session:
        try:
            print("Starting database seeding...")
            
            # Create users
            print("Creating users...")
            users = await create_users(session)
            print(f"Created {len(users)} users")
            
            # Create user roles
            print("Creating user roles...")
            await create_user_roles(session, users)
            print("User roles created")
            
            # Get coaches for classes
            coaches = [u for u in users if u.primary_role == UserRole.coach]
            
            # Create classes
            print("Creating classes...")
            classes = await create_classes(session, coaches)
            print(f"Created {len(classes)} classes")
            
            # Create bookings
            print("Creating bookings...")
            bookings = await create_bookings(session, users, classes)
            print(f"Created {len(bookings)} bookings")
            
            # Create progress records
            print("Creating progress records...")
            progress_records = await create_progress(session, users)
            print(f"Created {len(progress_records)} progress records")
            
            # Create tournaments
            print("Creating tournaments...")
            tournaments = await create_tournaments(session)
            print(f"Created {len(tournaments)} tournaments")
            
            # Create tournament participations
            print("Creating tournament participations...")
            participations = await create_tournament_participations(session, users, tournaments)
            print(f"Created {len(participations)} tournament participations")
            
            # Create achievements
            print("Creating achievements...")
            achievements = await create_achievements(session, users, tournaments)
            print(f"Created {len(achievements)} achievements")
            
            # Create chat rooms
            print("Creating chat rooms...")
            chat_rooms = await create_chat_rooms(session, users)
            print(f"Created {len(chat_rooms)} chat rooms")
            
            # Create chat messages
            print("Creating chat messages...")
            messages = await create_chat_messages(session, users, chat_rooms)
            print(f"Created {len(messages)} chat messages")
            
            # Create products
            print("Creating products...")
            products = await create_products(session)
            print(f"Created {len(products)} products")
            
            # Create notifications
            print("Creating notifications...")
            notifications = await create_notifications(session, users)
            print(f"Created {len(notifications)} notifications")
            
            print("Database seeding completed successfully!")
            print(f"\nSummary:")
            print(f"- Users: {len(users)}")
            print(f"- Classes: {len(classes)}")
            print(f"- Bookings: {len(bookings)}")
            print(f"- Progress records: {len(progress_records)}")
            print(f"- Tournaments: {len(tournaments)}")
            print(f"- Tournament participations: {len(participations)}")
            print(f"- Achievements: {len(achievements)}")
            print(f"- Chat rooms: {len(chat_rooms)}")
            print(f"- Chat messages: {len(messages)}")
            print(f"- Products: {len(products)}")
            print(f"- Notifications: {len(notifications)}")
            
            print(f"\nTest accounts:")
            print(f"- Head Coach: headcoach@aiga.kz / password123")
            print(f"- Coach 1: coach1@aiga.kz / password123")
            print(f"- Parent 1: parent1@mail.ru / password123")
            print(f"- Athlete 1: athlete1@mail.ru / password123")
            
        except Exception as e:
            print(f"Error during seeding: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(main()) 