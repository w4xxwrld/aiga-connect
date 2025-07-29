from logging.config import fileConfig

from sqlalchemy import create_engine
from alembic import context

from app.config import settings
from app.database import Base
# Импортируем все модели
from app.users.models import User, UserRole, UserRoleAssignment, ParentAthleteRelationship
from app.classes.models import Class
from app.bookings.models import Booking, IndividualTrainingRequest
from app.progress.models import Progress
from app.notifications.models import Notification
from app.merchandise.models import Product, ProductVariant, ProductCollection
from app.chat.models import ChatRoom, ChatMessage, ChatMembership, MessageReaction, ForumCategory, ForumTopic, ForumReply

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


def compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):
    """Функция для правильного сравнения типов, особенно enum"""
    # Если это enum типы, сравниваем их имена
    if hasattr(metadata_type, 'name') and hasattr(inspected_type, 'name'):
        return metadata_type.name != inspected_type.name
    return None

def include_object(object, name, type_, reflected, compare_to):
    """Функция для фильтрации объектов при автогенерации"""
    # Не пытаемся создавать enum типы, которые уже существуют
    if type_ == "type" and name in ['beltlevel', 'userrole', 'agegroup', 'difficultylevel', 
                                    'classstatus', 'bookingstatus', 'bookingtype', 
                                    'individualtrainingstatus', 'relationshiptype']:
        return False
    return True

def run_migrations_online():
    """Online режим (подключается к БД и применяет миграции)"""
    connectable = create_engine(DATABASE_URL)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            # Добавляем функции сравнения и фильтрации
            type_compare_function=compare_type,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


# Определяем режим запуска
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()