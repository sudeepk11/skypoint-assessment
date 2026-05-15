"""Pydantic schemas for application-related requests and responses."""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreate(BaseModel):
    """Schema for submitting a job application."""

    resume_text: str = Field(..., min_length=1, max_length=50_000)
    cover_letter: Optional[str] = Field(None, max_length=10_000)


class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""

    status: Literal["pending", "reviewing", "shortlisted", "rejected"]


# ---------------------------------------------------------------------------
# Nested sub-schemas for enriched responses
# ---------------------------------------------------------------------------


class CandidateInfo(BaseModel):
    """Minimal candidate details embedded in application responses."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str


class JobInfo(BaseModel):
    """Minimal job details embedded in application responses."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    location: str
    employment_type: str
    salary_range: Optional[str] = None


class ApplicationOut(BaseModel):
    """Public representation of a job application, with nested candidate and job info."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    candidate_id: UUID
    resume_text: str
    cover_letter: Optional[str]
    status: str
    ai_evaluation: Optional[str]
    applied_at: datetime
    updated_at: datetime

    # Nested relations — populated when loaded with joinedload
    candidate: Optional[CandidateInfo] = None
    job: Optional[JobInfo] = None
