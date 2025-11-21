"""Expand QR code column for unified attendance code

Revision ID: b7c8d9e0f1g2
Revises: a1b2c3d4e5f6
Create Date: 2025-11-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1g2'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Expand qr_code column from 3 to 255 characters."""
    # Alter the qr_code column to allow longer strings
    op.alter_column('attendance', 'qr_code',
                    existing_type=sa.String(length=3),
                    type_=sa.String(length=255),
                    existing_nullable=False)


def downgrade() -> None:
    """Revert qr_code column back to 3 characters."""
    # Note: This may truncate data if QR codes longer than 3 characters exist
    op.alter_column('attendance', 'qr_code',
                    existing_type=sa.String(length=255),
                    type_=sa.String(length=3),
                    existing_nullable=False)
