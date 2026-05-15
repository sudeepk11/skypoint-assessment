"""Shared helpers for building user response objects from ORM instances."""

from app.models.user import User
from app.schemas.user import UserOut


def build_user_out(user: User) -> UserOut:
    """Flatten user + sub-table into a single UserOut response."""
    data: dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": user.created_at,
    }
    if user.role == "hr" and user.company:
        c = user.company
        data.update(
            company_name=c.name,
            company_website=c.website,
            company_description=c.description,
            company_linkedin_url=c.linkedin_url,
            company_twitter_url=c.twitter_url,
            company_glassdoor_url=c.glassdoor_url,
        )
    if user.role == "candidate" and user.candidate_profile:
        p = user.candidate_profile
        data.update(
            headline=p.headline,
            skills=p.skills,
            linkedin_url=p.linkedin_url,
            twitter_url=p.twitter_url,
            github_url=p.github_url,
            portfolio_url=p.portfolio_url,
        )
    return UserOut(**data)
