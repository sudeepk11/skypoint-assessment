"""Pydantic schemas for job-related requests and responses."""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class JobCreate(BaseModel):
    """Schema for creating a new job posting."""

    title: str
    description: str
    requirements: str
    location: str
    employment_type: Literal["full_time", "part_time", "contract", "remote"]
    salary_range: Optional[str] = None
    skills: List[str] = []

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty.")
        if len(v) > 200:
            raise ValueError("Title must not exceed 200 characters.")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Description cannot be empty.")
        if len(v) > 10_000:
            raise ValueError("Description must not exceed 10,000 characters.")
        return v

    @field_validator("requirements")
    @classmethod
    def validate_requirements(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Requirements cannot be empty.")
        if len(v) > 5_000:
            raise ValueError("Requirements must not exceed 5,000 characters.")
        return v

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Location cannot be empty.")
        if len(v) > 200:
            raise ValueError("Location must not exceed 200 characters.")
        return v

    @field_validator("salary_range")
    @classmethod
    def validate_salary_range(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Salary range must not exceed 100 characters.")
            return v or None
        return v

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v: List[str]) -> List[str]:
        if len(v) > 30:
            raise ValueError("Cannot specify more than 30 skills.")
        # Trim each skill and drop blank entries; cap individual skill length at 50
        return [s.strip()[:50] for s in v if s.strip()]


class JobUpdate(BaseModel):
    """Schema for updating an existing job posting (all fields optional)."""

    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[Literal["full_time", "part_time", "contract", "remote"]] = None
    salary_range: Optional[str] = None
    skills: Optional[List[str]] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty.")
            if len(v) > 200:
                raise ValueError("Title must not exceed 200 characters.")
        return v

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            if len(v) > 30:
                raise ValueError("Cannot specify more than 30 skills.")
            return [s.strip()[:50] for s in v if s.strip()]
        return v


class JobStatusUpdate(BaseModel):
    """Schema for toggling a job's open/closed status."""

    status: Literal["open", "closed"]


class JobOut(BaseModel):
    """Public representation of a job posting."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    requirements: str
    location: str
    employment_type: str
    salary_range: Optional[str]
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    skills: List[str] = []


class JobWithApplicantCount(JobOut):
    """Job representation with the number of applicants — for HR dashboard."""

    applicant_count: int = 0
