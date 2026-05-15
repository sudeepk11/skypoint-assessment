"""Connection model — HR invites a candidate to apply for a specific job."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy import text as sa_text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import GUID


class Connection(Base):
    """Represents an HR-to-candidate job invite."""

    __tablename__ = "connections"
    __table_args__ = (
        # Two partial unique indexes replace the old nullable unique constraint.
        # A standard UniqueConstraint on (requester_id, receiver_id, job_id) is
        # bypassed when job_id IS NULL because NULL != NULL in SQL — meaning
        # duplicate no-job invites could be created silently.
        Index(
            "uq_invite_with_job",
            "requester_id", "receiver_id", "job_id",
            unique=True,
            postgresql_where=sa_text("job_id IS NOT NULL"),
            sqlite_where=sa_text("job_id IS NOT NULL"),
        ),
        Index(
            "uq_invite_no_job",
            "requester_id", "receiver_id",
            unique=True,
            postgresql_where=sa_text("job_id IS NULL"),
            sqlite_where=sa_text("job_id IS NULL"),
        ),
    )

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    requester_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id  = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id       = Column(GUID, ForeignKey("jobs.id",  ondelete="SET NULL"), nullable=True,  index=True)
    message      = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "accepted", "declined", name="connection_status"),
        default="pending",
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    requester = relationship("User", foreign_keys=[requester_id], backref="invites_sent")
    receiver  = relationship("User", foreign_keys=[receiver_id],  backref="invites_received")
    job       = relationship("Job",  foreign_keys=[job_id])
