"""Connections — peer networking between users (invite, accept, decline, list, suggest)."""

import json
from typing import List
from uuid import UUID

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.connection import Connection
from app.models.user import User

router = APIRouter(prefix="/connections", tags=["connections"])


# ---------------------------------------------------------------------------
# Schemas (inline — small enough not to need a separate file)
# ---------------------------------------------------------------------------

class UserPublic(BaseModel):
    """Minimal public view of a user shown in connection cards."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    role: str
    headline: str | None = None
    skills: str | None = None          # JSON string
    linkedin_url: str | None = None
    github_url: str | None = None
    glassdoor_url: str | None = None
    twitter_url: str | None = None
    portfolio_url: str | None = None
    company_name: str | None = None


class ConnectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    requester: UserPublic
    receiver: UserPublic


class SuggestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic
    overlap: int          # number of shared skills
    shared_skills: List[str]


class UserWithStatus(BaseModel):
    """Public user profile + connection status relative to the caller."""
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic
    connection_status: str                    # "none" | "pending_sent" | "pending_received" | "connected"
    connection_id: Optional[str] = None       # set when a connection row exists


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_skills(skills_json: str | None) -> set[str]:
    if not skills_json:
        return set()
    try:
        return {s.strip().lower() for s in json.loads(skills_json) if s.strip()}
    except Exception:
        return set()


def _existing_connection(db: Session, a: UUID, b: UUID) -> Connection | None:
    """Return any connection row between two users regardless of direction."""
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


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/suggestions", response_model=List[SuggestionOut])
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return up to 20 users who share skills with the current user.
    Already-connected and pending-invite users are excluded.
    """
    my_skills = _parse_skills(current_user.skills)

    # IDs already in a connection with me (any status)
    existing_ids: set[UUID] = set()
    for conn in db.query(Connection).filter(
        or_(
            Connection.requester_id == current_user.id,
            Connection.receiver_id == current_user.id,
        )
    ).all():
        existing_ids.add(conn.requester_id)
        existing_ids.add(conn.receiver_id)
    existing_ids.discard(current_user.id)

    # All other users (exclude self + already connected)
    others = (
        db.query(User)
        .filter(User.id != current_user.id)
        .all()
    )
    others = [u for u in others if u.id not in existing_ids]

    suggestions = []
    for user in others:
        their_skills = _parse_skills(user.skills)
        shared = my_skills & their_skills
        # If current user has no skills yet, show everyone (overlap = 0)
        suggestions.append(
            SuggestionOut(
                user=UserPublic.model_validate(user),
                overlap=len(shared),
                shared_skills=sorted(shared),
            )
        )

    # Sort by overlap desc, then name asc; cap at 20
    suggestions.sort(key=lambda s: (-s.overlap, s.user.full_name))
    return suggestions[:20]


@router.post("/{user_id}", response_model=ConnectionOut, status_code=status.HTTP_201_CREATED)
def send_invite(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a connection invite to another user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = _existing_connection(db, current_user.id, user_id)
    if existing:
        raise HTTPException(status_code=409, detail="Connection already exists.")

    conn = Connection(requester_id=current_user.id, receiver_id=user_id, status="pending")
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("", response_model=List[ConnectionOut])
def list_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all accepted connections for the current user."""
    return (
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


@router.get("/pending", response_model=List[ConnectionOut])
def list_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invites received by the current user that are still pending."""
    return (
        db.query(Connection)
        .filter(
            Connection.receiver_id == current_user.id,
            Connection.status == "pending",
        )
        .all()
    )


@router.get("/sent", response_model=List[ConnectionOut])
def list_sent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invites sent by the current user."""
    return (
        db.query(Connection)
        .filter(Connection.requester_id == current_user.id)
        .all()
    )


@router.patch("/{connection_id}/accept", response_model=ConnectionOut)
def accept_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    if conn.status != "pending":
        raise HTTPException(status_code=400, detail="Connection is not pending.")
    conn.status = "accepted"
    db.commit()
    db.refresh(conn)
    return conn


@router.patch("/{connection_id}/decline", response_model=ConnectionOut)
def decline_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")
    if conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    conn.status = "declined"
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/{connection_id}", status_code=204)
def remove_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove / cancel a connection (either party can do this)."""
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")
    if conn.requester_id != current_user.id and conn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised.")
    db.delete(conn)
    db.commit()
