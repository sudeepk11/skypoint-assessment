"""Connection model — peer networking between candidates (and HR)."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import GUID


class Connection(Base):
    """Represents a connection request between two users."""

    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint("requester_id", "receiver_id", name="uq_connection_pair"),
    )

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    requester_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(
        Enum("pending", "accepted", "declined", name="connection_status"),
        default="pending",
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    requester = relationship("User", foreign_keys=[requester_id], backref="connections_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="connections_received")
