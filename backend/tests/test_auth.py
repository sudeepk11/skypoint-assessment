"""Tests for authentication endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _register(client, email, role="candidate"):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password@1234",
            "full_name": "Test User",
            "role": role,
        },
    )


def test_register_hr(client: TestClient):
    """Registering with role=hr should return 200 and a user object."""
    email = f"hr_{uuid.uuid4().hex[:8]}@test.com"
    resp = _register(client, email, role="hr")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "hr"
    assert data["user"]["email"] == email
    assert "access_token" in data


def test_register_candidate(client: TestClient):
    """Registering with role=candidate should return 200 and a user object."""
    email = f"cand_{uuid.uuid4().hex[:8]}@test.com"
    resp = _register(client, email, role="candidate")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "candidate"


def test_register_duplicate_email(client: TestClient):
    """Registering the same email twice should return 400."""
    email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
    _register(client, email)
    resp = _register(client, email)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_login_success(client: TestClient):
    """Logging in with correct credentials should return an access token."""
    email = f"login_{uuid.uuid4().hex[:8]}@test.com"
    _register(client, email, role="candidate")

    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Password@1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient):
    """Logging in with an incorrect password should return 401."""
    email = f"wrongpw_{uuid.uuid4().hex[:8]}@test.com"
    _register(client, email, role="candidate")

    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert resp.status_code == 401


def test_login_wrong_email(client: TestClient):
    """Logging in with an unregistered email should return 401."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@nowhere.com", "password": "Password@1234"},
    )
    assert resp.status_code == 401


def test_get_me_authenticated(client: TestClient, candidate_token: str):
    """GET /api/auth/me with a valid token should return the user profile."""
    resp = client.get("/api/auth/me", headers=auth_headers(candidate_token))
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert data["role"] == "candidate"


def test_get_me_unauthenticated(client: TestClient):
    """GET /api/auth/me without a token should return 401."""
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
