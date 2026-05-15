"""Dashboard routes providing summary analytics for HR and candidates."""

from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, require_candidate, require_hr
from app.models.application import Application
from app.models.job import Job
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/hr", response_model=Dict[str, Any])
def hr_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Return summary analytics for the HR dashboard. HR only."""
    total_jobs = db.query(func.count(Job.id)).scalar()
    open_jobs = db.query(func.count(Job.id)).filter(Job.status == "open").scalar()
    total_applications = db.query(func.count(Application.id)).scalar()

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    shortlisted_this_week = (
        db.query(func.count(Application.id))
        .filter(
            Application.status == "shortlisted",
            Application.updated_at >= one_week_ago,
        )
        .scalar()
    )

    # Applications grouped by status
    status_counts_raw = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    applications_by_status = {
        "pending": 0,
        "reviewing": 0,
        "shortlisted": 0,
        "rejected": 0,
    }
    for s, count in status_counts_raw:
        if s in applications_by_status:
            applications_by_status[s] = count

    # Recent applications (last 10) — eager-load relations to avoid N+1
    recent_applications = (
        db.query(Application)
        .options(joinedload(Application.candidate), joinedload(Application.job))
        .order_by(Application.applied_at.desc())
        .limit(10)
        .all()
    )
    recent_apps_data = [
        {
            "id": str(app.id),
            "candidate_name": app.candidate.full_name if app.candidate else "Unknown",
            "candidate_email": app.candidate.email if app.candidate else "Unknown",
            "job_title": app.job.title if app.job else "Unknown",
            "status": app.status,
            "applied_at": app.applied_at.isoformat(),
        }
        for app in recent_applications
    ]

    # Jobs performance
    jobs_perf_raw = (
        db.query(Job, func.count(Application.id).label("applicant_count"))
        .outerjoin(Application, Application.job_id == Job.id)
        .group_by(Job.id)
        .order_by(func.count(Application.id).desc())
        .limit(10)
        .all()
    )
    jobs_performance = [
        {
            "id": str(job.id),
            "title": job.title,
            "status": job.status,
            "applicant_count": count,
        }
        for job, count in jobs_perf_raw
    ]

    return {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "total_applications": total_applications,
        "shortlisted_this_week": shortlisted_this_week,
        "applications_by_status": applications_by_status,
        "recent_applications": recent_apps_data,
        "jobs_performance": jobs_performance,
    }


@router.get("/candidate", response_model=Dict[str, Any])
def candidate_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate),
):
    """Return summary analytics for the candidate dashboard. Candidate only."""
    total_applied = (
        db.query(func.count(Application.id))
        .filter(Application.candidate_id == current_user.id)
        .scalar()
    )

    pending = (
        db.query(func.count(Application.id))
        .filter(
            Application.candidate_id == current_user.id,
            Application.status == "pending",
        )
        .scalar()
    )

    shortlisted = (
        db.query(func.count(Application.id))
        .filter(
            Application.candidate_id == current_user.id,
            Application.status == "shortlisted",
        )
        .scalar()
    )

    rejected = (
        db.query(func.count(Application.id))
        .filter(
            Application.candidate_id == current_user.id,
            Application.status == "rejected",
        )
        .scalar()
    )

    recent_applications = (
        db.query(Application)
        .options(joinedload(Application.job))
        .filter(Application.candidate_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .limit(10)
        .all()
    )
    recent_apps_data = [
        {
            "id": str(app.id),
            "job_id": str(app.job_id),
            "candidate_id": str(app.candidate_id),
            "resume_text": app.resume_text,
            "cover_letter": app.cover_letter,
            "status": app.status,
            "ai_evaluation": app.ai_evaluation,
            "applied_at": app.applied_at.isoformat(),
            "updated_at": app.updated_at.isoformat(),
            "job": {
                "id": str(app.job.id),
                "title": app.job.title,
                "location": app.job.location,
                "employment_type": app.job.employment_type,
                "salary_range": app.job.salary_range,
            } if app.job else None,
        }
        for app in recent_applications
    ]

    return {
        "total_applied": total_applied,
        "pending": pending,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "recent_applications": recent_apps_data,
    }
