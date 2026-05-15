"""Pydantic schemas for HR and candidate dashboard responses."""

from typing import List, Optional

from pydantic import BaseModel


class ApplicationsByStatus(BaseModel):
    pending: int = 0
    reviewing: int = 0
    shortlisted: int = 0
    rejected: int = 0


class HRRecentApplication(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    job_title: str
    status: str
    applied_at: str


class JobPerformance(BaseModel):
    id: str
    title: str
    status: str
    applicant_count: int


class HRDashboardOut(BaseModel):
    total_jobs: int
    open_jobs: int
    total_applications: int
    shortlisted_this_week: int
    applications_by_status: ApplicationsByStatus
    recent_applications: List[HRRecentApplication]
    jobs_performance: List[JobPerformance]


class CandidateJobBrief(BaseModel):
    id: str
    title: str
    location: str
    employment_type: str
    salary_range: Optional[str] = None


class CandidateRecentApplication(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    resume_text: Optional[str] = None
    cover_letter: Optional[str] = None
    status: str
    applied_at: str
    updated_at: str
    job: Optional[CandidateJobBrief] = None


class CandidateDashboardOut(BaseModel):
    total_applied: int
    pending: int
    shortlisted: int
    rejected: int
    recent_applications: List[CandidateRecentApplication]
