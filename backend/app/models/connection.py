"""Connection model — HR invites a candidate to apply for a specific job."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import GUID


class Connection(Base):
    """Represents an HR-to-candidate job invite."""

    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint("requester_id", "receiver_id", "job_id", name="uq_invite_per_job"),
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
