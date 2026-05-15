"""add indexes on job status created_by and application candidate_id

Revision ID: 967eb5766817
Revises: f17e5cdcd189
Create Date: 2026-05-16 02:02:03.451840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '967eb5766817'
down_revision: Union[str, None] = 'f17e5cdcd189'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_created_by", "jobs", ["created_by"])
    op.create_index("ix_applications_candidate_id", "applications", ["candidate_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_candidate_id", table_name="applications")
    op.drop_index("ix_jobs_created_by", table_name="jobs")
    op.drop_index("ix_jobs_status", table_name="jobs")
