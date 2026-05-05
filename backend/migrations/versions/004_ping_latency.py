"""add last_ping_latency_ms to signal_reading

Revision ID: 004
Revises: 003
Create Date: 2026-05-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('signal_reading', sa.Column('last_ping_latency_ms', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('signal_reading', 'last_ping_latency_ms')
