"""Add soft delete (deleted_at) to all tables

Revision ID: a1b2c3d4e5f6
Revises: e43f58f41ae6
Create Date: 2025-11-18 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e43f58f41ae6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add deleted_at column to all tables for soft delete functionality."""
    # Add deleted_at column to users table
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_users_deleted_at'), 'users', ['deleted_at'], unique=False)

    # Add deleted_at column to classes table
    op.add_column('classes', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_classes_deleted_at'), 'classes', ['deleted_at'], unique=False)

    # Add deleted_at column to bookings table
    op.add_column('bookings', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_bookings_deleted_at'), 'bookings', ['deleted_at'], unique=False)

    # Add deleted_at column to individual_training_requests table
    op.add_column('individual_training_requests', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_individual_training_requests_deleted_at'), 'individual_training_requests', ['deleted_at'], unique=False)

    # Add deleted_at column to attendance table
    op.add_column('attendance', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_attendance_deleted_at'), 'attendance', ['deleted_at'], unique=False)


def downgrade() -> None:
    """Remove deleted_at column from all tables."""
    # Drop indexes and columns in reverse order
    op.drop_index(op.f('ix_attendance_deleted_at'), table_name='attendance')
    op.drop_column('attendance', 'deleted_at')

    op.drop_index(op.f('ix_individual_training_requests_deleted_at'), table_name='individual_training_requests')
    op.drop_column('individual_training_requests', 'deleted_at')

    op.drop_index(op.f('ix_bookings_deleted_at'), table_name='bookings')
    op.drop_column('bookings', 'deleted_at')

    op.drop_index(op.f('ix_classes_deleted_at'), table_name='classes')
    op.drop_column('classes', 'deleted_at')

    op.drop_index(op.f('ix_users_deleted_at'), table_name='users')
    op.drop_column('users', 'deleted_at')
