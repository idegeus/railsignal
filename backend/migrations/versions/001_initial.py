"""initial

Revision ID: 001
Revises:
Create Date: 2026-05-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        'journey',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('ended_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('reading_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('platform', sa.Text(), nullable=True),
        sa.Column('app_version', sa.Text(), nullable=True),
    )

    op.create_table(
        'signal_reading',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('journey_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('journey.id'), nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry('POINT', srid=4326), nullable=True),
        sa.Column('signal_dbm', sa.Integer(), nullable=True),
        sa.Column('network_type', sa.String(8), nullable=True),
        sa.Column('mcc', sa.String(5), nullable=True),
        sa.Column('mnc', sa.String(5), nullable=True),
        sa.Column('speed_kmh', sa.Float(), nullable=True),
        sa.Column('platform', sa.Text(), nullable=True),
        sa.Column('app_version', sa.Text(), nullable=True),
        sa.Column('received_at', sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('uploader_ip', sa.String(45), nullable=True),
    )
    op.create_index('idx_reading_journey', 'signal_reading', ['journey_id'])
    op.create_index('idx_reading_timestamp', 'signal_reading', ['timestamp'])
    op.create_index('idx_reading_ip', 'signal_reading', ['uploader_ip'])

    op.create_table(
        'segment_aggregate',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('segment_geom', geoalchemy2.types.Geometry('POINT', srid=4326),
                  nullable=False),
        sa.Column('route_id', sa.Text(), nullable=False, index=True),
        sa.Column('operator', sa.Text(), nullable=True),
        sa.Column('avg_signal_dbm', sa.Float(), nullable=True),
        sa.Column('pct_no_signal', sa.Float(), nullable=True),
        sa.Column('pct_good', sa.Float(), nullable=True),
        sa.Column('dominant_net', sa.Text(), nullable=True),
        sa.Column('sample_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('segment_aggregate')
    op.drop_table('signal_reading')
    op.drop_table('journey')
