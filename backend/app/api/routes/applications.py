"""Application routes for candidates and HR."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_candidate, require_hr
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate

router = APIRouter(tags=["applications"])


@router.post(
    "/jobs/{job_id}/apply",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: UUID,
    application_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate),
):
    """Submit an application for a job. Candidate only.

    Raises:
        HTTPException 404: Job not found.
        HTTPException 400: Job is closed or duplicate application.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply to a closed job",
        )

    existing = (
        db.query(Application)
        .filter(
            Application.job_id == job_id,
            Application.candidate_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job",
        )

    application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_text=application_in.resume_text,
        cover_letter=application_in.cover_letter,
    )
    db.add(application)
    db.commit()

    # Re-query with eager-loaded relations so the response contains nested candidate/job
    application = (
        db.query(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .filter(Application.id == application.id)
        .first()
    )
    return application


@router.get("/applications", response_model=List[ApplicationOut])
def list_applications(
    job_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List applications.

    - HR sees all applications.
    - Candidates see only their own applications.
    """
    query = db.query(Application).options(
        joinedload(Application.candidate),
        joinedload(Application.job),
    )

    if current_user.role == "candidate":
        query = query.filter(Application.candidate_id == current_user.id)
    elif current_user.role == "hr":
        query = query.join(Job, Application.job_id == Job.id).filter(
            Job.created_by == current_user.id
        )

    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status_filter:
        query = query.filter(Application.status == status_filter)

    return query.order_by(Application.applied_at.desc()).all()


@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a specific application.

    - HR can access any application.
    - Candidates can only access their own.

    Raises:
        HTTPException 404: Application not found or access denied.
    """
    application = (
        db.query(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == "candidate" and application.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == "hr" and (
        not application.job or application.job.created_by != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    return application


@router.patch("/applications/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: UUID,
    status_in: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Update an application's status. HR only."""
    application = (
        db.query(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Ensure this HR user owns the job the application is for
    if application.job and application.job.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update this application",
        )

    application.status = status_in.status
    db.commit()
    db.refresh(application)

    # Re-fetch with relations after commit (refresh doesn't reload relationships)
    application = (
        db.query(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .filter(Application.id == application_id)
        .first()
    )
    return application
