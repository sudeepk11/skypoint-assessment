"""Application database model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text, UniqueConstraint  # noqa: F401
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import GUID


class Application(Base):
    """Job application model submitted by candidates."""

    __tablename__ = "applications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    job_id = Column(GUID, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    resume_text = Column(Text, nullable=False)
    cover_letter = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "reviewing", "shortlisted", "rejected", name="application_status"),
        nullable=False,
        default="pending",
    )
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Unique constraint: one application per candidate per job
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_application_job_candidate"),)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
