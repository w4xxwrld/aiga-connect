"""merge heads

Revision ID: 8f8170007b4f
Revises: 53b2be21b088, c1234abcd567
Create Date: 2025-07-30 02:21:11.444200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f8170007b4f'
down_revision: Union[str, Sequence[str], None] = ('53b2be21b088', 'c1234abcd567')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
