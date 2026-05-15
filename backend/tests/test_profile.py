"""Tests for profile get/update and password-change endpoints."""

import uuid

from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _register(client, role="candidate"):
    email = f"{role}_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password@1234",
            "full_name": f"{role.title()} User",
            "role": role,
        },
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# GET /api/profile
# ---------------------------------------------------------------------------


def test_get_profile_authenticated(client: TestClient, candidate_token: str):
    """Authenticated user should get their own profile."""
    resp = client.get("/api/profile", headers=auth_headers(candidate_token))
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert data["role"] == "candidate"


def test_get_profile_unauthenticated(client: TestClient):
    """Unauthenticated request to /api/profile should return 401."""
    resp = client.get("/api/profile")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/profile
# ---------------------------------------------------------------------------


def test_update_full_name(client: TestClient, candidate_token: str):
    """Updating full_name should be reflected in the response."""
    resp = client.put(
        "/api/profile",
        json={"full_name": "Updated Name"},
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


def test_update_headline_and_skills(client: TestClient, candidate_token: str):
    """Candidate should be able to update headline and skills."""
    resp = client.put(
        "/api/profile",
        json={"headline": "Python Developer", "skills": '["Python","FastAPI"]'},
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["headline"] == "Python Developer"
    assert data["skills"] == '["Python","FastAPI"]'


def test_update_social_links(client: TestClient, candidate_token: str):
    """Candidate should be able to set social profile URLs."""
    resp = client.put(
        "/api/profile",
        json={
            "linkedin_url": "https://linkedin.com/in/test",
            "github_url": "https://github.com/test",
            "portfolio_url": "https://test.dev",
        },
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["linkedin_url"] == "https://linkedin.com/in/test"
    assert data["github_url"] == "https://github.com/test"
    assert data["portfolio_url"] == "https://test.dev"


def test_partial_update_preserves_other_fields(client: TestClient):
    """Updating one field must not wipe other existing fields."""
    token = _register(client, "candidate")

    # First set both headline and skills.
    client.put(
        "/api/profile",
        json={"headline": "First Headline", "skills": '["Go"]'},
        headers=auth_headers(token),
    )

    # Now update only the headline.
    resp = client.put(
        "/api/profile",
        json={"headline": "Updated Headline"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["headline"] == "Updated Headline"
    assert data["skills"] == '["Go"]'  # skills must be untouched


def test_hr_can_update_company_fields(client: TestClient):
    """HR user should be able to update company_name and company_website."""
    token = _register(client, "hr")
    resp = client.put(
        "/api/profile",
        json={
            "company_name": "Acme Corp",
            "company_website": "https://acme.example.com",
            "company_description": "We build things.",
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "Acme Corp"
    assert data["company_website"] == "https://acme.example.com"


def test_profile_update_unauthenticated(client: TestClient):
    """PUT /api/profile without auth should return 401."""
    resp = client.put("/api/profile", json={"full_name": "Nobody"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/profile/password
# ---------------------------------------------------------------------------


def test_change_password_success(client: TestClient):
    """Valid current password should allow changing to a new strong password."""
    token = _register(client, "candidate")
    resp = client.put(
        "/api/profile/password",
        json={"current_password": "Password@1234", "new_password": "NewPass@5678"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 204


def test_change_password_wrong_current(client: TestClient, candidate_token: str):
    """Wrong current password should return 400."""
    resp = client.put(
        "/api/profile/password",
        json={"current_password": "WrongPassword@1", "new_password": "NewPass@5678"},
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 400
    assert "incorrect" in resp.json()["detail"].lower()


def test_change_password_weak_new_password(client: TestClient, candidate_token: str):
    """New password failing strength rules should return 422."""
    resp = client.put(
        "/api/profile/password",
        json={"current_password": "Password@1234", "new_password": "weakpass"},
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 422
