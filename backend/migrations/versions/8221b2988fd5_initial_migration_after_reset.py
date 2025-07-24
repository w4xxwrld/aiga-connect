"""Initial migration after reset

Revision ID: 8221b2988fd5
Revises: 
Create Date: 2025-07-24 20:37:52.150469

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8221b2988fd5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Шаг 1: создаём enum
    userrole_enum = sa.Enum('parent', 'athlete', 'coach', name='userrole')
    userrole_enum.create(op.get_bind())

    # Шаг 2: добавляем колонку с nullable=True временно
    op.add_column('users', sa.Column('role', userrole_enum, nullable=True))

    # Шаг 3: обновляем все строки, устанавливая временное значение
    op.execute("UPDATE users SET role = 'parent'")  # Или 'athlete' по дефолту

    # Шаг 4: делаем колонку NOT NULL
    op.alter_column('users', 'role', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'role')
    userrole_enum = sa.Enum('parent', 'athlete', 'coach', name='userrole')
    userrole_enum.drop(op.get_bind())