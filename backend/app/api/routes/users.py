"""Public user lookup — returns a user's public profile + connection status."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.routes.connections import UserPublic, UserWithStatus, _existing_connection
from app.models.user import User

router = APIRouter(tags=["users"])


@router.get("/users/{user_id}", response_model=UserWithStatus)
def get_public_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a user's public profile and connection status relative to the caller."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    conn = _existing_connection(db, current_user.id, user_id)

    if conn is None:
        conn_status = "none"
        conn_id = None
    elif conn.status == "accepted":
        conn_status = "connected"
        conn_id = str(conn.id)
    elif conn.status == "pending":
        if str(conn.requester_id) == str(current_user.id):
            conn_status = "pending_sent"
        else:
            conn_status = "pending_received"
        conn_id = str(conn.id)
    else:
        conn_status = "none"
        conn_id = None

    return UserWithStatus(
        user=UserPublic.model_validate(target),
        connection_status=conn_status,
        connection_id=conn_id,
    )
