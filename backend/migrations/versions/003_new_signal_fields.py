"""new signal fields: rsrp, rsrq, sinr, pci, earfcn, band, cqi, timing_advance, cell_count, gps_accuracy

Revision ID: 003
Revises: 002
Create Date: 2026-05-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('signal_reading', sa.Column('rsrp',           sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('rsrq',           sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('sinr',           sa.Float(),   nullable=True))
    op.add_column('signal_reading', sa.Column('pci',            sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('earfcn',         sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('band',           sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('cqi',            sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('timing_advance', sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('cell_count',     sa.Integer(), nullable=True))
    op.add_column('signal_reading', sa.Column('gps_accuracy',   sa.Float(),   nullable=True))
    op.add_column('signal_reading', sa.Column('last_ping_ms',   sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column('signal_reading', 'last_ping_ms')
    op.drop_column('signal_reading', 'gps_accuracy')
    op.drop_column('signal_reading', 'cell_count')
    op.drop_column('signal_reading', 'timing_advance')
    op.drop_column('signal_reading', 'cqi')
    op.drop_column('signal_reading', 'band')
    op.drop_column('signal_reading', 'earfcn')
    op.drop_column('signal_reading', 'pci')
    op.drop_column('signal_reading', 'sinr')
    op.drop_column('signal_reading', 'rsrq')
    op.drop_column('signal_reading', 'rsrp')
