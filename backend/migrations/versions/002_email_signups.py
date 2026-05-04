"""email signups table

Revision ID: 002
Revises: 001
Create Date: 2026-05-04 00:00:00.000000
"""
import sqlalchemy as sa
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'email_signup',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('email', sa.Text(), nullable=False, unique=True),
        sa.Column('signed_up_at', sa.TIMESTAMP(timezone=True),
                  nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('email_signup')
