"""update_belt_level_enum

Revision ID: b0692d978dbb
Revises: 53b2be21b088
Create Date: 2025-07-29 12:49:13.759162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0692d978dbb'
down_revision: Union[str, Sequence[str], None] = 'ae274bb29a41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем недостающие значения в enum beltlevel
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'purple'")
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'juvenile_white'")
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'juvenile_grey'")
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'juvenile_yellow'")
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'juvenile_orange'")
    op.execute("ALTER TYPE beltlevel ADD VALUE IF NOT EXISTS 'juvenile_green'")


def downgrade() -> None:
    """Downgrade schema."""
    # Нельзя удалить значения из enum в PostgreSQL без пересоздания типа
    pass
