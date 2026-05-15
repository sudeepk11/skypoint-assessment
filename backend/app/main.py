"""FastAPI application entry point."""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text as sa_text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from app.api.routes import applications, auth, dashboard, email, jobs, profile
from app.core.limiter import limiter
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("skypoint")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables and seed default data on startup."""
    Base.metadata.create_all(bind=engine)
    # Add new columns to existing tables (idempotent)
    try:
        with engine.connect() as conn:
            conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)"))
            conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_website VARCHAR(255)"))
            conn.execute(sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_description TEXT"))
            conn.commit()
    except Exception:
        pass  # Columns already exist or not PostgreSQL
    # Ensure skills column is JSON type (fix if was previously added as TEXT)
    try:
        with engine.connect() as conn:
            # Drop and re-add as JSON if it exists as TEXT (idempotent via IF NOT EXISTS on JSON col)
            conn.execute(sa_text("ALTER TABLE jobs DROP COLUMN IF EXISTS skills"))
            conn.execute(sa_text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills JSON DEFAULT '[]'"))
            conn.commit()
    except Exception:
        pass
    seed_data()
    yield


app = FastAPI(
    title="Skypoint Job Portal API",
    version="1.0.0",
    description="Backend API for the Skypoint Job Portal application",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach standard security headers to every response."""

    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status code, and duration for every request."""

    async def dispatch(self, request: StarletteRequest, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 2)
        logger.info(
            "[%s] %s %s -> %s (%sms)",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        return response


# ---------------------------------------------------------------------------
# CORS — allow all origins for Docker/local dev
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler — logs the full traceback and returns a safe 500 response."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(email.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(profile.router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
def health_check():
    """Liveness + readiness probe — checks DB connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(sa_text("SELECT 1"))
        db_status = "healthy"
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        db_status = "unhealthy"

    status = "healthy" if db_status == "healthy" else "degraded"
    return {
        "status": status,
        "version": "1.0.0",
        "services": {
            "database": db_status,
            "api": "healthy",
        },
    }


@app.get("/", include_in_schema=False)
def root():
    """Root redirect — points consumers to the docs."""
    return {"message": "Skypoint Job Portal API", "version": "1.0.0", "docs": "/docs"}


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------


def seed_data() -> None:
    """Seed the database with default users and sample jobs if they don't exist."""
    from app.models.job import Job
    from app.models.user import User

    db = SessionLocal()
    try:
        # Seed HR user
        hr_user = db.query(User).filter(User.email == "hr@test.com").first()
        if not hr_user:
            hr_user = User(
                email="hr@test.com",
                password_hash=hash_password("HR@1234"),
                full_name="HR Admin",
                role="hr",
            )
            db.add(hr_user)
            db.flush()

        # Seed candidate user
        candidate_user = db.query(User).filter(User.email == "candidate@test.com").first()
        if not candidate_user:
            candidate_user = User(
                email="candidate@test.com",
                password_hash=hash_password("Candidate@1234"),
                full_name="Test Candidate",
                role="candidate",
            )
            db.add(candidate_user)
            db.flush()

        # Seed sample jobs
        sample_jobs = [
            {
                "title": "Software Engineer",
                "description": (
                    "We are looking for a passionate Software Engineer to design, develop, "
                    "and maintain high-quality software systems."
                ),
                "requirements": (
                    "3+ years of experience in Python or Java. "
                    "Strong knowledge of RESTful APIs, databases, and cloud platforms."
                ),
                "location": "San Francisco, CA",
                "employment_type": "full_time",
                "salary_range": "$120,000 - $160,000",
            },
            {
                "title": "Product Manager",
                "description": (
                    "Join our product team to define product vision, build roadmaps, "
                    "and deliver exceptional user experiences."
                ),
                "requirements": (
                    "5+ years of product management experience. "
                    "Strong analytical skills and experience with Agile methodologies."
                ),
                "location": "New York, NY",
                "employment_type": "full_time",
                "salary_range": "$130,000 - $170,000",
            },
            {
                "title": "Data Analyst",
                "description": (
                    "We seek a detail-oriented Data Analyst to interpret data, build dashboards, "
                    "and provide actionable business insights."
                ),
                "requirements": (
                    "2+ years of experience with SQL, Python, or R. "
                    "Experience with BI tools such as Tableau or Power BI."
                ),
                "location": "Remote",
                "employment_type": "remote",
                "salary_range": "$90,000 - $120,000",
            },
        ]

        for job_data in sample_jobs:
            existing = db.query(Job).filter(Job.title == job_data["title"]).first()
            if not existing:
                job = Job(
                    created_by=hr_user.id,
                    **job_data,
                )
                db.add(job)

        db.commit()
    finally:
        db.close()
