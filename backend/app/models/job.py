"""Job database model."""

import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import GUID


class Job(Base):
    """Job posting model."""

    __tablename__ = "jobs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    employment_type = Column(
        Enum("full_time", "part_time", "contract", "remote", name="employment_type"),
        nullable=False,
    )
    salary_range = Column(String(100), nullable=True)
    skills = Column(JSON, nullable=False, default=list, server_default='[]')
    status = Column(
        Enum("open", "closed", name="job_status"),
        nullable=False,
        default="open",
    )
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    creator = relationship("User", back_populates="jobs_created")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
