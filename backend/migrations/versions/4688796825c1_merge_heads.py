"""merge heads

Revision ID: 4688796825c1
Revises: 71e096e109aa
Create Date: 2025-07-30 04:17:57.405464

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4688796825c1'
down_revision: Union[str, Sequence[str], None] = '71e096e109aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
