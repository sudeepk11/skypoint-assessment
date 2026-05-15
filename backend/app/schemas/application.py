"""Pydantic schemas for application-related requests and responses."""

import os
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApplicationCreate(BaseModel):
    """Schema for submitting a job application (JSON fallback, not used by file-upload endpoint)."""

    resume_text: Optional[str] = Field(None, min_length=1, max_length=50_000)
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
    resume_filename: Optional[str] = None
    resume_file_path: Optional[str] = Field(None, exclude=True)
    resume_url: Optional[str] = None
    cover_letter: Optional[str]
    status: str
    applied_at: datetime
    updated_at: datetime

    # Nested relations — populated when loaded with joinedload
    candidate: Optional[CandidateInfo] = None
    job: Optional[JobInfo] = None

    @model_validator(mode="after")
    def build_resume_url(self) -> "ApplicationOut":
        if self.resume_file_path:
            self.resume_url = f"/uploads/{os.path.basename(self.resume_file_path)}"
        return self
