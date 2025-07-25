from logging.config import fileConfig

from sqlalchemy import create_engine
from alembic import context

from app.config import settings
from app.database import Base
# Импортируем все модели
from app.users.models import User, ParentAthleteRelationship
from app.classes.models import Class
from app.bookings.models import Booking

# Настройка логов Alembic
fileConfig(context.config.config_file_name)

# Metadata всех моделей
target_metadata = Base.metadata

# URL БД для Alembic (psycopg2)
DATABASE_URL = settings.ALEMBIC_DATABASE_URL


def run_migrations_offline():
    """Offline режим (генерирует SQL-файл без подключения к БД)"""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Online режим (подключается к БД и применяет миграции)"""
    connectable = create_engine(DATABASE_URL)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# Определяем режим запуска
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()