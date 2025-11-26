"""Add admin to userrole enum

Revision ID: d1e2f3g4h5i6
Revises: c9d8e7f6g5h4
Create Date: 2025-11-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3g4h5i6'
down_revision: Union[str, Sequence[str], None] = 'c9d8e7f6g5h4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'admin' value to userrole enum."""
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin'")


def downgrade() -> None:
    """Remove 'admin' from userrole enum - note: PostgreSQL doesn't support removing enum values easily."""
    # PostgreSQL doesn't support DROP VALUE from enum
    # To truly downgrade, you'd need to recreate the enum type
    pass
