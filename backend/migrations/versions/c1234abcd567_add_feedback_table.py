"""add_feedback_table

Revision ID: c1234abcd567
Revises: 24a2b287aea4
Create Date: 2025-07-29 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1234abcd567'
down_revision = '24a2b287aea4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('author_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('trainer_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('rating', sa.Integer, nullable=False),
        sa.Column('comment', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_feedback_id'), 'feedback', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_feedback_id'), table_name='feedback')
    op.drop_table('feedback')
