"""add resume file columns to applications

Revision ID: a3f2b8c1d5e0
Revises: 0139cdbe7e85
Create Date: 2026-05-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "a3f2b8c1d5e0"
down_revision = "0139cdbe7e85"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("applications", "resume_text", nullable=True)
    op.add_column("applications", sa.Column("resume_file_path", sa.String(500), nullable=True))
    op.add_column("applications", sa.Column("resume_filename", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "resume_filename")
    op.drop_column("applications", "resume_file_path")
    # Note: reverting nullable=True → nullable=False may fail if NULL rows exist
    op.alter_column("applications", "resume_text", nullable=False)
