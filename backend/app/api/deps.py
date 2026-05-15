"""FastAPI dependency functions for database sessions and authentication."""

from typing import Generator, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.user import User

# auto_error=False so it doesn't raise when there's no Authorization header
# (we fall back to the HttpOnly cookie in that case)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy database session and close it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    token_header: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the JWT and return the authenticated user.

    Checks the HttpOnly ``access_token`` cookie first; falls back to the
    ``Authorization: Bearer`` header so API clients and tests still work.

    Raises:
        HTTPException 401: If the token is missing, invalid, or the user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Authorization header wins when explicitly provided (API clients, tests).
    # Fall back to the HttpOnly cookie for browser requests that send no header.
    token = token_header or request.cookies.get("access_token")
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


def require_hr(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the current user has the 'hr' role.

    Raises:
        HTTPException 403: If the user is not an HR member.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required",
        )
    return current_user


def require_candidate(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the current user has the 'candidate' role.

    Raises:
        HTTPException 403: If the user is not a candidate.
    """
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required",
        )
    return current_user
