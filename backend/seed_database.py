#!/usr/bin/env python3
"""
Database Seeder Script
Generates random test data for the AIGA Connect application.

Run with: python seed_database.py
"""

import asyncio
import random
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Import models
from app.users.models import User, UserRole, RoleStatus
from app.classes.models import Class, DifficultyLevel
from app.bookings.models import Booking, BookingStatus, IndividualTrainingRequest, IndividualTrainingStatus
from app.attendance.models import Attendance
from app.database import Base
from app.config import settings

# Sample data for generating random users
FIRST_NAMES = [
    "Alikhan", "Bekzat", "Dauren", "Erlan", "Farhat", "Galym", "Hussain", "Ilyas",
    "Janat", "Kanat", "Marat", "Nurlan", "Omar", "Ruslan", "Saken", "Timur",
    "Ulugbek", "Vali", "Yerzhan", "Zhanibek", "Adilkhan", "Baurzhan", "Daniyar",
    "Aigerim", "Balzhan", "Dana", "Elmira", "Farida", "Gulnaz", "Inkar", "Jazira",
    "Kamila", "Leila", "Madina", "Nazym", "Sabina", "Togzhan", "Ulzhan", "Zarina"
]

LAST_NAMES = [
    "Akhmetov", "Baitursynov", "Dauletov", "Erkinov", "Fakhretdinov", "Gabdullin",
    "Isaev", "Kairbekov", "Makhmutov", "Nazarbayev", "Omarov", "Rakhimov", "Suleimenov",
    "Tursynov", "Utegenov", "Zhanuzakov", "Abdullayev", "Beisembayev", "Daulenov",
    "Zhunussov", "Kassymov", "Mukanov", "Nurpeisov", "Satybaldiyev", "Tolegenov"
]

CLASS_NAMES = [
    "Greco-Roman Wrestling Fundamentals",
    "Freestyle Wrestling Beginners",
    "Advanced Greco-Roman Techniques",
    "Junior Wrestling Camp",
    "Professional Wrestling Training",
    "Wrestling Conditioning",
    "Competition Preparation",
    "Grappling Basics",
    "Takedown Mastery",
    "Mat Work Essentials",
    "Youth Wrestling Development",
    "Elite Performance Training"
]

CLASS_DESCRIPTIONS = [
    "Learn the fundamental techniques of wrestling with focus on proper form and safety.",
    "Intensive training session for competitive wrestlers preparing for tournaments.",
    "Build strength, endurance, and flexibility specific to wrestling performance.",
    "Master advanced techniques and strategies used by professional wrestlers.",
    "Fun and engaging class designed for young athletes new to wrestling.",
    "Focus on ground control, escapes, and pinning combinations.",
    "Develop explosive takedowns and counter-wrestling skills.",
    "Comprehensive training covering all aspects of wrestling competition."
]

DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def random_phone():
    """Generate a random Kazakh phone number"""
    return f"+7{random.randint(700, 799)}{random.randint(1000000, 9999999)}"


def random_date_of_birth(min_age: int, max_age: int) -> date:
    """Generate a random date of birth within age range"""
    today = date.today()
    min_date = today - timedelta(days=max_age * 365)
    max_date = today - timedelta(days=min_age * 365)
    days_between = (max_date - min_date).days
    random_days = random.randint(0, days_between)
    return min_date + timedelta(days=random_days)


def random_time(start_hour: int = 8, end_hour: int = 20) -> time:
    """Generate a random time between start and end hour"""
    hour = random.randint(start_hour, end_hour)
    minute = random.choice([0, 30])
    return time(hour=hour, minute=minute)


async def create_coaches(session: AsyncSession, count: int = 5) -> list[User]:
    """Create random coach users"""
    coaches = []
    for i in range(count):
        coach = User(
            phone=random_phone(),
            first_name=random.choice(FIRST_NAMES),
            last_name=random.choice(LAST_NAMES),
            email=f"coach{i+1}@aiga.kz",
            birth_date=random_date_of_birth(25, 55),
            primary_role=UserRole.coach,
            role_status=RoleStatus.approved,
        )
        session.add(coach)
        coaches.append(coach)

    await session.flush()
    print(f"Created {len(coaches)} coaches")
    return coaches


async def create_athletes(session: AsyncSession, count: int = 20) -> list[User]:
    """Create random athlete users"""
    athletes = []
    for i in range(count):
        athlete = User(
            phone=random_phone(),
            first_name=random.choice(FIRST_NAMES),
            last_name=random.choice(LAST_NAMES),
            email=f"athlete{i+1}@aiga.kz",
            birth_date=random_date_of_birth(8, 25),
            primary_role=UserRole.athlete,
            role_status=RoleStatus.approved,
        )
        session.add(athlete)
        athletes.append(athlete)

    await session.flush()
    print(f"Created {len(athletes)} athletes")
    return athletes


async def create_classes(session: AsyncSession, coaches: list[User], count: int = 10) -> list[Class]:
    """Create random classes assigned to coaches"""
    classes = []
    difficulties = list(DifficultyLevel)

    for i in range(count):
        start = random_time(8, 18)
        # End time is 1-2 hours after start
        end_hour = start.hour + random.randint(1, 2)
        end = time(hour=min(end_hour, 21), minute=start.minute)

        # Random 2-3 days per week
        num_days = random.randint(2, 3)
        days = random.sample(DAYS_OF_WEEK, num_days)

        class_obj = Class(
            name=random.choice(CLASS_NAMES),
            description=random.choice(CLASS_DESCRIPTIONS),
            difficulty_level=random.choice(difficulties),
            coach_id=random.choice(coaches).id,
            days_of_week=days,
            start_time=start,
            end_time=end,
            max_capacity=random.randint(10, 30),
            price=random.randint(5000, 20000),
        )
        session.add(class_obj)
        classes.append(class_obj)

    await session.flush()
    print(f"Created {len(classes)} classes")
    return classes


async def create_bookings(
    session: AsyncSession,
    athletes: list[User],
    classes: list[Class],
    count: int = 50
) -> list[Booking]:
    """Create random bookings"""
    bookings = []
    statuses = [BookingStatus.confirmed, BookingStatus.completed, BookingStatus.pending]

    for i in range(count):
        # Random class date in the past 30 days or future 14 days
        days_offset = random.randint(-30, 14)
        class_date = datetime.now() + timedelta(days=days_offset)

        status = random.choice(statuses)
        if days_offset < 0:
            status = BookingStatus.completed

        athlete = random.choice(athletes)
        class_obj = random.choice(classes)

        booking = Booking(
            athlete_id=athlete.id,
            class_id=class_obj.id,
            status=status,
            class_date=class_date,
            is_paid=random.choice([True, True, True, False]),  # 75% paid
            payment_amount=Decimal(class_obj.price),
        )
        session.add(booking)
        bookings.append(booking)

    await session.flush()
    print(f"Created {len(bookings)} bookings")
    return bookings


async def create_individual_training_requests(
    session: AsyncSession,
    athletes: list[User],
    coaches: list[User],
    count: int = 15
) -> list[IndividualTrainingRequest]:
    """Create random individual training requests"""
    requests = []
    statuses = list(IndividualTrainingStatus)

    for i in range(count):
        days_offset = random.randint(-14, 21)
        requested_date = datetime.now() + timedelta(days=days_offset)

        status = random.choice(statuses)
        if days_offset < -7:
            status = random.choice([IndividualTrainingStatus.completed, IndividualTrainingStatus.declined])

        start_hour = random.randint(9, 18)

        request = IndividualTrainingRequest(
            athlete_id=random.choice(athletes).id,
            coach_id=random.choice(coaches).id,
            requested_date=requested_date,
            preferred_time_start=f"{start_hour:02d}:00",
            preferred_time_end=f"{start_hour + 1:02d}:00",
            status=status,
            is_paid=status == IndividualTrainingStatus.completed,
            payment_amount=Decimal(random.randint(10000, 30000)) if status == IndividualTrainingStatus.completed else None,
            athlete_notes="Хочу улучшить технику захвата" if random.random() > 0.5 else None,
        )

        if status in [IndividualTrainingStatus.accepted, IndividualTrainingStatus.completed]:
            request.scheduled_date = requested_date
            request.scheduled_time_start = request.preferred_time_start
            request.scheduled_time_end = request.preferred_time_end
            request.coach_notes = "Подтверждено. Жду на тренировку!" if random.random() > 0.5 else None
        elif status == IndividualTrainingStatus.declined:
            request.decline_reason = "К сожалению, это время занято. Предлагаю другой день."

        session.add(request)
        requests.append(request)

    await session.flush()
    print(f"Created {len(requests)} individual training requests")
    return requests


async def create_attendance_records(
    session: AsyncSession,
    bookings: list[Booking],
    qr_code: str = "AIGA_ATTENDANCE_2024"
) -> list[Attendance]:
    """Create attendance records for completed/confirmed bookings"""
    attendance_records = []

    # Only create attendance for past bookings
    past_bookings = [b for b in bookings if b.class_date < datetime.now()]

    # 80% attendance rate
    attending_bookings = random.sample(
        past_bookings,
        int(len(past_bookings) * 0.8)
    )

    for booking in attending_bookings:
        attendance = Attendance(
            athlete_id=booking.athlete_id,
            class_id=booking.class_id,
            qr_code=qr_code,
            attendance_date=booking.class_date.date(),
            marked_at=booking.class_date + timedelta(minutes=random.randint(0, 15)),
        )
        session.add(attendance)
        attendance_records.append(attendance)

    await session.flush()
    print(f"Created {len(attendance_records)} attendance records")
    return attendance_records


async def create_admin(session: AsyncSession) -> User:
    """Create an admin user for testing"""
    admin = User(
        phone="+77001234567",
        first_name="Admin",
        last_name="AIGA",
        email="admin@aiga.kz",
        birth_date=date(1990, 1, 1),
        primary_role=UserRole.admin,
        role_status=RoleStatus.approved,
    )
    session.add(admin)
    await session.flush()
    print("Created admin user: +77001234567")
    return admin


async def seed_database():
    """Main seeding function"""
    print("=" * 50)
    print("AIGA Connect Database Seeder")
    print("=" * 50)
    print(f"Database URL: {settings.DATABASE_URL[:50]}...")
    print()

    # Create engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Create all data
            admin = await create_admin(session)
            coaches = await create_coaches(session, count=5)
            athletes = await create_athletes(session, count=20)
            classes = await create_classes(session, coaches, count=10)
            bookings = await create_bookings(session, athletes, classes, count=50)
            await create_individual_training_requests(session, athletes, coaches, count=15)
            await create_attendance_records(session, bookings)

            # Commit all changes
            await session.commit()

            print()
            print("=" * 50)
            print("Database seeded successfully!")
            print("=" * 50)
            print()
            print("Test accounts created:")
            print(f"  Admin: +77001234567")
            print(f"  Coaches: {len(coaches)} accounts")
            print(f"  Athletes: {len(athletes)} accounts")
            print()
            print("Sample coach phones:")
            for coach in coaches[:3]:
                print(f"  - {coach.phone} ({coach.first_name} {coach.last_name})")
            print()
            print("Sample athlete phones:")
            for athlete in athletes[:3]:
                print(f"  - {athlete.phone} ({athlete.first_name} {athlete.last_name})")

        except Exception as e:
            await session.rollback()
            print(f"Error seeding database: {e}")
            raise

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
