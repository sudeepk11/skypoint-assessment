"""Authentication routes: register, login, logout, and current user."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.utils.user_utils import build_user_out
from app.config import settings
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import RegisterResponse, TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_NAME = "access_token"
_COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _set_auth_cookie(response: Response, token: str) -> None:
    """Attach the JWT as an HttpOnly cookie to *response*."""
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=_COOKIE_MAX_AGE,
        secure=settings.COOKIE_SECURE,
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
@limiter.limit("5/minute")
def register(
    request: Request,
    response: Response,
    user_in: UserRegister,
    db: Session = Depends(get_db),
):
    """Register a new user and return a JWT access token. Rate-limited to 5/min per IP."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    _set_auth_cookie(response, token)
    return RegisterResponse(access_token=token, token_type="bearer", user=build_user_out(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """Authenticate with email/password and return a JWT token. Rate-limited to 10/min per IP."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id)})
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token, token_type="bearer", user=build_user_out(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    """Clear the auth cookie, effectively logging the user out."""
    response.delete_cookie(key=_COOKIE_NAME, path="/", httponly=True)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return build_user_out(current_user)
