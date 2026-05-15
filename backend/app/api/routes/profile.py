"""Profile management routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import verify_password, hash_password
from app.models.candidate_profile import CandidateProfile
from app.models.company import Company
from app.models.user import User
from app.schemas.user import ChangePassword, UpdateProfile, UserOut
from app.utils.user_utils import build_user_out

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return build_user_out(current_user)


@router.put("", response_model=UserOut)
def update_profile(
    data: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name

    if current_user.role == "hr":
        company = current_user.company
        if company is None:
            company = Company(user_id=current_user.id)
            db.add(company)
            current_user.company = company
        if data.company_name is not None:
            company.name = data.company_name
        if data.company_website is not None:
            company.website = data.company_website
        if data.company_description is not None:
            company.description = data.company_description
        if data.company_linkedin_url is not None:
            company.linkedin_url = data.company_linkedin_url
        if data.company_twitter_url is not None:
            company.twitter_url = data.company_twitter_url
        if data.company_glassdoor_url is not None:
            company.glassdoor_url = data.company_glassdoor_url

    if current_user.role == "candidate":
        profile = current_user.candidate_profile
        if profile is None:
            profile = CandidateProfile(user_id=current_user.id)
            db.add(profile)
            current_user.candidate_profile = profile
        if data.headline is not None:
            profile.headline = data.headline
        if data.skills is not None:
            profile.skills = data.skills
        if data.linkedin_url is not None:
            profile.linkedin_url = data.linkedin_url
        if data.twitter_url is not None:
            profile.twitter_url = data.twitter_url
        if data.github_url is not None:
            profile.github_url = data.github_url
        if data.portfolio_url is not None:
            profile.portfolio_url = data.portfolio_url

    db.commit()
    db.refresh(current_user)
    return build_user_out(current_user)


@router.put("/password", status_code=204)
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
