"""Fix payment amounts to decimal and add performance indexes

Revision ID: a1b2c3d4e5f6
Revises: 5cf66e7985c5
Create Date: 2025-10-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5cf66e7985c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Fix payment_amount fields from Integer to Numeric(10, 2) for proper money handling
    op.alter_column('bookings', 'payment_amount',
                    existing_type=sa.Integer(),
                    type_=sa.Numeric(10, 2),
                    existing_nullable=True)

    op.alter_column('individual_training_requests', 'payment_amount',
                    existing_type=sa.Integer(),
                    type_=sa.Numeric(10, 2),
                    existing_nullable=True)

    # Add performance indexes
    # Bookings indexes
    op.create_index('ix_bookings_athlete_status', 'bookings', ['athlete_id', 'status'])
    op.create_index('ix_bookings_class_date', 'bookings', ['class_date'])

    # Individual training requests indexes
    op.create_index('ix_individual_training_coach_status', 'individual_training_requests', ['coach_id', 'status'])

    # Products indexes
    op.create_index('ix_products_category_status', 'products', ['category', 'status'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove indexes
    op.drop_index('ix_products_category_status', table_name='products')
    op.drop_index('ix_individual_training_coach_status', table_name='individual_training_requests')
    op.drop_index('ix_bookings_class_date', table_name='bookings')
    op.drop_index('ix_bookings_athlete_status', table_name='bookings')

    # Revert payment_amount fields back to Integer
    op.alter_column('individual_training_requests', 'payment_amount',
                    existing_type=sa.Numeric(10, 2),
                    type_=sa.Integer(),
                    existing_nullable=True)

    op.alter_column('bookings', 'payment_amount',
                    existing_type=sa.Numeric(10, 2),
                    type_=sa.Integer(),
                    existing_nullable=True)
