"""FastAPI application entry point."""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from app.api.routes import applications, auth, connections, dashboard, email, jobs, profile, users
from app.config import settings
from app.core.limiter import limiter
from sqlalchemy import text as sa_text

from app.database import engine

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("skypoint")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="SkyHire API",
    version="1.0.0",
    description="Backend API for the SkyHire application",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security headers middleware
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


# Request logging middleware
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


# CORS — origin allowlist from ALLOWED_ORIGINS env var; wildcard disables credentials
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
_wildcard = _allowed_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# Global exception handler
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


# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(email.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(connections.router, prefix="/api")
app.include_router(users.router, prefix="/api")


# Health check
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

    if db_status != "healthy":
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "version": "1.0.0", "services": {"database": db_status, "api": "healthy"}},
        )
    return {"status": "healthy", "version": "1.0.0", "services": {"database": "healthy", "api": "healthy"}}


@app.get("/", include_in_schema=False)
def root():
    """Root redirect — points consumers to the docs."""
    return {"message": "SkyHire API", "version": "1.0.0", "docs": "/docs"}

