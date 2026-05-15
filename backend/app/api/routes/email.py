"""Email routes for bulk HR communications via AWS SES."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_hr
from app.models.application import Application
from app.models.user import User
from app.services.email_service import send_bulk_email

router = APIRouter(prefix="/email", tags=["email"])


class BulkEmailRequest(BaseModel):
    """Request schema for sending bulk emails to applicants."""

    application_ids: List[UUID]
    subject: str
    body: str


@router.post("/bulk")
def send_bulk(
    request: BulkEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    """Send bulk emails to candidates via AWS SES. HR only.

    Resolves the candidate email and name from the given application IDs, then
    sends each recipient an individual email.

    Raises:
        HTTPException 503: If AWS SES credentials are not configured.
        HTTPException 404: If no valid applications are found.
    """
    applications = (
        db.query(Application)
        .filter(Application.id.in_([str(aid) for aid in request.application_ids]))
        .all()
    )

    if not applications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No applications found for the provided IDs",
        )

    recipients = []
    for app in applications:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        if candidate:
            recipients.append({"name": candidate.full_name, "email": candidate.email})

    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid recipients found",
        )

    result = send_bulk_email(
        recipients=recipients,
        subject=request.subject,
        body=request.body,
    )
    return result
