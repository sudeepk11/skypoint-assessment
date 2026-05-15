"""Connections — HR invites candidates to apply for a specific job."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_hr
from app.models.connection import Connection
from app.models.job import Job
from app.models.user import User

router = APIRouter(prefix="/connections", tags=["connections"])


class UserPublic(BaseModel):
    id: UUID
    full_name: str
    role: str
    headline: Optional[str] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    company_name: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    company_twitter_url: Optional[str] = None
    company_glassdoor_url: Optional[str] = None


class JobBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    location: str
    employment_type: str
    salary_range: Optional[str] = None
    company_name: Optional[str] = None   # filled manually


class ConnectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    message: Optional[str] = None
    requester: UserPublic
    receiver: UserPublic
    job_id: Optional[UUID] = None
    job: Optional[JobBrief] = None


class CandidateOut(BaseModel):
    """Candidate profile shown to HR in the talent pool."""
    id: UUID
    full_name: str
    headline: Optional[str] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class InviteRequest(BaseModel):
    job_id: Optional[UUID] = None
    message: Optional[str] = None


class UserWithStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic
    connection_status: str
    connection_id: Optional[str] = None


def _user_public(user: User) -> UserPublic:
    p = user.candidate_profile
    c = user.company
    return UserPublic(
        id=user.id,
        full_name=user.full_name,
        role=user.role,
        headline=p.headline if p else None,
        skills=p.skills if p else None,
        linkedin_url=p.linkedin_url if p else None,
        twitter_url=p.twitter_url if p else None,
        github_url=p.github_url if p else None,
        portfolio_url=p.portfolio_url if p else None,
        company_name=c.name if c else None,
        company_linkedin_url=c.linkedin_url if c else None,
        company_twitter_url=c.twitter_url if c else None,
        company_glassdoor_url=c.glassdoor_url if c else None,
    )


def _candidate_out(user: User) -> CandidateOut:
    p = user.candidate_profile
    return CandidateOut(
        id=user.id,
        full_name=user.full_name,
        headline=p.headline if p else None,
        skills=p.skills if p else None,
        linkedin_url=p.linkedin_url if p else None,
        twitter_url=p.twitter_url if p else None,
        github_url=p.github_url if p else None,
        portfolio_url=p.portfolio_url if p else None,
    )


def _existing_connection(db: Session, a: UUID, b: UUID) -> Optional[Connection]:
    return (
        db.query(Connection)
        .filter(
            or_(
                and_(Connection.requester_id == a, Connection.receiver_id == b),
                and_(Connection.requester_id == b, Connection.receiver_id == a),
            )
        )
        .first()
    )


def _enrich_connection(conn: Connection, db: Session) -> ConnectionOut:
    """Build ConnectionOut with flattened user and job data."""
    job_brief = None
    if conn.job:
        creator = db.query(User).filter(User.id == conn.job.created_by).first()
        job_brief = JobBrief(
            id=conn.job.id,
            title=conn.job.title,
            location=conn.job.location,
            employment_type=conn.job.employment_type,
            salary_range=conn.job.salary_range,
            company_name=creator.company.name if creator and creator.company else None,
        )
    return ConnectionOut(
        id=conn.id,
        status=conn.status,
        message=conn.message,
        job_id=conn.job_id,
        job=job_brief,
        requester=_user_public(conn.requester),
        receiver=_user_public(conn.receiver),
    )


@router.get("/candidates", response_model=List[CandidateOut])
def list_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Return all candidates — visible to HR only."""
    candidates = db.query(User).filter(User.role == "candidate").all()
    return [_candidate_out(c) for c in candidates]


@router.post("/{candidate_id}", response_model=ConnectionOut, status_code=201)
def send_invite(
    candidate_id: UUID,
    body: InviteRequest = InviteRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """HR sends a job invite to a candidate."""
    if current_user.role != "hr":
        raise HTTPException(status_code=403, detail="Only HR can send invites.")

    candidate = db.query(User).filter(User.id == candidate_id, User.role == "candidate").first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    # Validate job belongs to this HR (if provided)
    if body.job_id:
        job = db.query(Job).filter(Job.id == body.job_id, Job.created_by == current_user.id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or not yours.")

    # Allow multiple invites for different jobs; block duplicate for same job
    existing = (
        db.query(Connection)
        .filter(
            Connection.requester_id == current_user.id,
            Connection.receiver_id == candidate_id,
            Connection.job_id == body.job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Invite already sent for this job.")

    conn = Connection(
        requester_id=current_user.id,
        receiver_id=candidate_id,
        job_id=body.job_id,
        message=body.message,
        status="pending",
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return _enrich_connection(conn, db)


@router.get("", response_model=List[ConnectionOut])
def list_accepted(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accepted invites — for both HR and candidate."""
    rows = (
        db.query(Connection)
        .filter(
            Connection.status == "accepted",
            or_(
                Connection.requester_id == current_user.id,
                Connection.receiver_id == current_user.id,
            ),
        )
        .all()
    )
    return [_enrich_connection(r, db) for r in rows]


@router.get("/pending", response_model=List[ConnectionOut])
def list_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pending invites received by current user (candidates see HR invites here)."""
    rows = (
        db.query(Connection)
        .filter(
            Connection.receiver_id == current_user.id,
            Connection.status == "pending",
        )
        .all()
    )
    return [_enrich_connection(r, db) for r in rows]


@router.get("/sent", response_model=List[ConnectionOut])
def list_sent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invites sent by current user."""
    rows = (
        db.query(Connection)
        .filter(Connection.requester_id == current_user.id)
        .all()
    )
    return [_enrich_connection(r, db) for r in rows]


@router.patch("/{connection_id}/accept", response_model=ConnectionOut)
def accept_invite(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Invite not found.")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    if conn.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is not pending.")
    conn.status = "accepted"
    db.commit()
    db.refresh(conn)
    return _enrich_connection(conn, db)


@router.patch("/{connection_id}/decline", response_model=ConnectionOut)
def decline_invite(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Invite not found.")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    conn.status = "declined"
    db.commit()
    db.refresh(conn)
    return _enrich_connection(conn, db)


@router.delete("/{connection_id}", status_code=204)
def remove_invite(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Invite not found.")
    if conn.requester_id != current_user.id and conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    db.delete(conn)
    db.commit()
