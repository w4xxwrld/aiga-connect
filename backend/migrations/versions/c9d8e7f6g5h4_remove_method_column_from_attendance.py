"""Remove method column from attendance table

Revision ID: c9d8e7f6g5h4
Revises: b7c8d9e0f1g2
Create Date: 2025-11-21 19:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d8e7f6g5h4'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1g2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove method column from attendance table."""
    op.drop_column('attendance', 'method')


def downgrade() -> None:
    """Add method column back to attendance table."""
    op.add_column('attendance',
                  sa.Column('method', sa.String(), nullable=False, server_default='qr_scan'))
