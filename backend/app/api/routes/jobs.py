"""Job posting routes for public browsing and HR management."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_hr
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobOut, JobStatusUpdate, JobUpdate, JobWithApplicantCount

router = APIRouter(tags=["jobs"])


@router.get("/jobs", response_model=List[JobOut])
def list_jobs(
    search: Optional[str] = Query(None, description="Keyword search in job title"),
    location: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    skills: Optional[str] = Query(None, description="Comma-separated skills to filter by"),
    db: Session = Depends(get_db),
):
    """List all open job postings with optional filters. Public endpoint."""
    query = db.query(Job).filter(Job.status == "open")

    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if employment_type:
        query = query.filter(Job.employment_type == employment_type)

    jobs_list = query.order_by(Job.created_at.desc()).all()

    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
        jobs_list = [
            j for j in jobs_list
            if any(
                any(sk in (tag.lower() if tag else '') for sk in skill_list)
                for tag in (j.skills or [])
            )
        ]

    creator_ids = [j.created_by for j in jobs_list]
    creators = {u.id: u for u in db.query(User).filter(User.id.in_(creator_ids)).all()}
    result = []
    for job in jobs_list:
        job_dict = JobOut.model_validate(job).model_dump()
        creator = creators.get(job.created_by)
        job_dict['company_name'] = creator.company.name if creator and creator.company else None
        result.append(JobOut(**job_dict))
    return result


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    """Retrieve a single job posting by ID. Public endpoint."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    job_dict = JobOut.model_validate(job).model_dump()
    creator = db.query(User).filter(User.id == job.created_by).first()
    job_dict['company_name'] = creator.company.name if creator and creator.company else None
    return JobOut(**job_dict)


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Create a new job posting. HR only."""
    job = Job(
        title=job_in.title,
        description=job_in.description,
        requirements=job_in.requirements,
        location=job_in.location,
        employment_type=job_in.employment_type,
        salary_range=job_in.salary_range,
        skills=job_in.skills,
        created_by=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/jobs/{job_id}", response_model=JobOut)
def update_job(
    job_id: UUID,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Update an existing job posting. HR only — must own the job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to edit this job")

    for field, value in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


@router.patch("/jobs/{job_id}/status", response_model=JobOut)
def update_job_status(
    job_id: UUID,
    status_in: JobStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Toggle a job's open/closed status. HR only — must own the job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to update this job")

    job.status = status_in.status
    db.commit()
    db.refresh(job)
    return job


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Delete a job posting and its applications. HR only — must own the job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to delete this job")

    db.delete(job)
    db.commit()


@router.get("/hr/jobs", response_model=List[JobWithApplicantCount])
def list_hr_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """List jobs created by the HR user, with applicant counts. HR only."""
    jobs = (
        db.query(Job, func.count(Application.id).label("applicant_count"))
        .outerjoin(Application, Application.job_id == Job.id)
        .filter(Job.created_by == current_user.id)
        .group_by(Job.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    result = []
    for job, count in jobs:
        job_dict = JobOut.model_validate(job).model_dump()
        job_dict["applicant_count"] = count
        job_dict["company_name"] = current_user.company.name if current_user.company else None
        result.append(JobWithApplicantCount(**job_dict))

    return result
