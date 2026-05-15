"""Pydantic schemas for email-related requests."""

from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class BulkEmailRequest(BaseModel):
    """Request schema for sending bulk emails to applicants."""

    application_ids: List[UUID]
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=10_000)
