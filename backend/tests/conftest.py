"""Pytest configuration and shared fixtures for the test suite."""

import os

# Override DATABASE_URL BEFORE any app module is imported so that
# app.database.engine is created pointing to SQLite, not PostgreSQL.
os.environ["DATABASE_URL"] = "sqlite://"
# SECRET_KEY is now required (no default) — provide a test-only value
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
# Disable rate limiting during tests so fixtures that call /register
# multiple times in rapid succession are not throttled.
os.environ["RATELIMIT_ENABLED"] = "0"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.deps import get_db  # noqa: E402
from app.database import Base  # noqa: E402
from app.main import app  # noqa: E402

# ---------------------------------------------------------------------------
# SQLite in-memory test database
# ---------------------------------------------------------------------------

SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override the real DB session with the SQLite test session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables in the SQLite test database once per test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(create_test_tables):
    """Return a FastAPI TestClient with the DB override applied.

    Rate limiting is disabled for the duration of each test so that
    fixtures which call auth endpoints many times in quick succession
    are not throttled by the in-memory per-IP counter.
    """
    app.dependency_overrides[get_db] = override_get_db
    # Disable slowapi rate limiting for tests so rapid fixture calls don't get throttled
    app.state.limiter.enabled = False
    with TestClient(app) as c:
        yield c
    app.state.limiter.enabled = True
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helper fixtures
# ---------------------------------------------------------------------------


def _unique_email(base: str) -> str:
    """Generate a unique email per test invocation using a UUID suffix."""
    import uuid

    return f"{base}+{uuid.uuid4().hex[:8]}@test.com"


@pytest.fixture
def hr_token(client: TestClient) -> str:
    """Register an HR user and return its JWT access token."""
    email = _unique_email("hr")
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password@1234",
            "full_name": "HR Test User",
            "role": "hr",
        },
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture
def candidate_token(client: TestClient) -> str:
    """Register a candidate user and return its JWT access token."""
    email = _unique_email("candidate")
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password@1234",
            "full_name": "Candidate Test User",
            "role": "candidate",
        },
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    """Return Authorization headers for the given JWT token."""
    return {"Authorization": f"Bearer {token}"}
