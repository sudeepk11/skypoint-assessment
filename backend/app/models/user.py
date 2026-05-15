"""User database model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, CHAR
import sqlalchemy.dialects.postgresql as pg


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's native UUID when available, otherwise stores as a 32-char CHAR.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(pg.UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value) if not isinstance(value, uuid.UUID) else value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


from app.database import Base


class User(Base):
    """User model for HR staff and candidates."""

    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum("hr", "candidate", name="user_role"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    company_name = Column(String(255), nullable=True)
    company_website = Column(String(255), nullable=True)
    company_description = Column(Text, nullable=True)

    # Relationships
    jobs_created = relationship("Job", back_populates="creator", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
