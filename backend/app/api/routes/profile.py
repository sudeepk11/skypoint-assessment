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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
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
    if len(data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
