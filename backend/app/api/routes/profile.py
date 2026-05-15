"""Profile management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.schemas.user import UserOut, UpdateProfile, ChangePassword

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=UserOut)
def update_profile(
    data: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Explicit field updates — never allows arbitrary attribute writes
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.company_name is not None:
        current_user.company_name = data.company_name
    if data.company_website is not None:
        current_user.company_website = data.company_website
    if data.company_description is not None:
        current_user.company_description = data.company_description
    if data.headline is not None:
        current_user.headline = data.headline
    if data.skills is not None:
        current_user.skills = data.skills
    if data.linkedin_url is not None:
        current_user.linkedin_url = data.linkedin_url
    if data.github_url is not None:
        current_user.github_url = data.github_url
    if data.glassdoor_url is not None:
        current_user.glassdoor_url = data.glassdoor_url
    if data.twitter_url is not None:
        current_user.twitter_url = data.twitter_url
    if data.portfolio_url is not None:
        current_user.portfolio_url = data.portfolio_url
    db.commit()
    db.refresh(current_user)
    return current_user


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
