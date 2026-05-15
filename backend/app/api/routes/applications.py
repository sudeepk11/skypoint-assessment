"""Application routes for candidates and HR."""

import os
import uuid as uuid_lib
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_candidate, require_hr
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.application import ApplicationOut, ApplicationStatusUpdate

router = APIRouter(tags=["applications"])

from app.config import settings

UPLOAD_DIR = settings.UPLOAD_DIR
ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/jobs/{job_id}/apply",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: UUID,
    resume: UploadFile = File(...),
    cover_letter: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate),
):
    """Submit an application for a job. Candidate only.

    Accepts a PDF or DOCX resume file via multipart/form-data.

    Raises:
        HTTPException 404: Job not found.
        HTTPException 400: Job is closed, duplicate application, or invalid file type.
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

    if resume.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    file_bytes = resume.file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds 5 MB limit",
        )

    # Persist file to disk
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_filename = f"{uuid_lib.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_file_path=file_path,
        resume_filename=resume.filename,
        cover_letter=cover_letter,
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
