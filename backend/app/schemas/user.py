"""Pydantic schemas for user-related requests and responses."""

import re
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


def _validate_password_strength(v: str) -> str:
    """Shared password strength validator for registration and password change."""
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one digit.")
    return v


class UserRegister(BaseModel):
    """Schema for registering a new user."""

    email: EmailStr
    password: str
    full_name: str
    role: Literal["hr", "candidate"]

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        if len(v) > 100:
            raise ValueError("Full name must not exceed 100 characters.")
        return v


class UserLogin(BaseModel):
    """Schema for user login via JSON body."""

    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Public representation of a user."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[str] = None          # JSON string — list of skill tags
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    glassdoor_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterResponse(BaseModel):
    """Response returned after a successful registration."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    # HR
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    # Shared
    headline: Optional[str] = None
    skills: Optional[str] = None          # JSON string
    # Social
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    glassdoor_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password_strength(v)
