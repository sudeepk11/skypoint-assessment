"""fix null unique constraint in connections via partial indexes

Revision ID: 0139cdbe7e85
Revises: 967eb5766817
Create Date: 2026-05-16 02:16:26.249698

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0139cdbe7e85'
down_revision: Union[str, None] = '967eb5766817'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old constraint — it was silently bypassed when job_id IS NULL
    # because NULL != NULL in SQL, allowing duplicate no-job invites.
    op.drop_constraint("uq_invite_per_job", "connections", type_="unique")
    # Two partial indexes replace it: one for rows with a job, one without.
    op.execute(
        "CREATE UNIQUE INDEX uq_invite_with_job "
        "ON connections (requester_id, receiver_id, job_id) "
        "WHERE job_id IS NOT NULL"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_invite_no_job "
        "ON connections (requester_id, receiver_id) "
        "WHERE job_id IS NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_invite_with_job")
    op.execute("DROP INDEX IF EXISTS uq_invite_no_job")
    op.create_unique_constraint(
        "uq_invite_per_job", "connections", ["requester_id", "receiver_id", "job_id"]
    )
