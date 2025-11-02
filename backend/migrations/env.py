from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
import sys
from pathlib import Path

# Добавляем backend в sys.path для импорта моделей
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.database import Base

# Импортируем все модели (ОБЯЗАТЕЛЬНО для autogenerate)
from app.users.models import User, UserRole
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest
from app.attendance.models import Attendance

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Используем Base.metadata из наших моделей
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.ALEMBIC_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = settings.ALEMBIC_DATABASE_URL
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

