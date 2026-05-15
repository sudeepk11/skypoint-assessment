"""Tests for job application endpoints."""

import pytest
from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JOB_PAYLOAD = {
    "title": "QA Engineer",
    "description": "Test everything.",
    "requirements": "pytest, Selenium",
    "location": "Remote",
    "employment_type": "remote",
}

# Minimal valid PDF bytes (just enough to not crash the multipart parser)
_FAKE_PDF = b"%PDF-1.4 fake resume content for testing"

def _apply_payload():
    """Return files/data kwargs for a multipart apply request."""
    return {
        "files": {"resume": ("resume.pdf", _FAKE_PDF, "application/pdf")},
        "data": {"cover_letter": "I am excited to apply for this role."},
    }


def _create_job(client, hr_token):
    """Helper: create a job and return its ID."""
    resp = client.post("/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr_token))
    assert resp.status_code == 201
    return resp.json()["id"]


def test_candidate_apply_to_job(client: TestClient, hr_token: str, candidate_token: str):
    """A candidate should be able to apply to an open job and receive 201."""
    job_id = _create_job(client, hr_token)
    resp = client.post(
        f"/api/jobs/{job_id}/apply",
        headers=auth_headers(candidate_token),
        **_apply_payload(),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["status"] == "pending"


def test_duplicate_application_blocked(client: TestClient, hr_token: str, candidate_token: str):
    """Applying to the same job twice should return 400."""
    job_id = _create_job(client, hr_token)
    client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload())
    resp = client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload())
    assert resp.status_code == 400
    assert "already applied" in resp.json()["detail"].lower()


def test_apply_to_closed_job_blocked(client: TestClient, hr_token: str, candidate_token: str):
    """Applying to a closed job should return 400."""
    job_id = _create_job(client, hr_token)
    client.patch(
        f"/api/jobs/{job_id}/status",
        json={"status": "closed"},
        headers=auth_headers(hr_token),
    )
    resp = client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload())
    assert resp.status_code == 400
    assert "closed" in resp.json()["detail"].lower()


def test_hr_views_own_job_applications(client: TestClient, hr_token: str, candidate_token: str):
    """HR should only see applications for jobs they created."""
    job_id = _create_job(client, hr_token)
    client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload())
    resp = client.get("/api/applications", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_candidate_views_own_applications(
    client: TestClient, hr_token: str, candidate_token: str
):
    """A candidate should only see their own applications."""
    job_id = _create_job(client, hr_token)
    client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload())
    resp = client.get("/api/applications", headers=auth_headers(candidate_token))
    assert resp.status_code == 200
    apps = resp.json()
    me_resp = client.get("/api/auth/me", headers=auth_headers(candidate_token))
    candidate_id = me_resp.json()["id"]
    for app in apps:
        assert app["candidate_id"] == candidate_id


def test_hr_updates_application_status(
    client: TestClient, hr_token: str, candidate_token: str
):
    """HR should be able to update the status of an application."""
    job_id = _create_job(client, hr_token)
    apply_resp = client.post(
        f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload()
    )
    app_id = apply_resp.json()["id"]

    resp = client.patch(
        f"/api/applications/{app_id}/status",
        json={"status": "shortlisted"},
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "shortlisted"


def test_candidate_cannot_update_status(
    client: TestClient, hr_token: str, candidate_token: str
):
    """A candidate should receive 403 when trying to update application status."""
    job_id = _create_job(client, hr_token)
    apply_resp = client.post(
        f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload()
    )
    app_id = apply_resp.json()["id"]

    resp = client.patch(
        f"/api/applications/{app_id}/status",
        json={"status": "rejected"},
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 403


def test_hr_views_application_detail(
    client: TestClient, hr_token: str, candidate_token: str
):
    """HR should be able to retrieve a specific application by ID."""
    job_id = _create_job(client, hr_token)
    apply_resp = client.post(
        f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate_token), **_apply_payload()
    )
    app_id = apply_resp.json()["id"]

    resp = client.get(f"/api/applications/{app_id}", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    assert resp.json()["id"] == app_id


# ---------------------------------------------------------------------------
# BOLA — HR must not read applications from another HR's jobs
# ---------------------------------------------------------------------------

import uuid as _uuid


def _register_hr(client):
    email = f"hr_{_uuid.uuid4().hex[:8]}@test.com"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password@1234", "full_name": "Other HR", "role": "hr"},
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def _register_candidate(client):
    email = f"cand_{_uuid.uuid4().hex[:8]}@test.com"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password@1234", "full_name": "Candidate", "role": "candidate"},
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def test_hr_cannot_list_other_hr_applications(client: TestClient):
    """HR_A must not see applications submitted to HR_B's jobs."""
    hr_a = _register_hr(client)
    hr_b = _register_hr(client)
    candidate = _register_candidate(client)

    # HR_B creates a job; candidate applies
    job_id = _create_job(client, hr_b)
    client.post(f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate), **_apply_payload())

    # HR_A should see an empty list
    resp = client.get("/api/applications", headers=auth_headers(hr_a))
    assert resp.status_code == 200
    assert resp.json() == []


def test_hr_cannot_fetch_other_hr_application_by_id(client: TestClient):
    """HR_A must get 404 when fetching an application on HR_B's job."""
    hr_a = _register_hr(client)
    hr_b = _register_hr(client)
    candidate = _register_candidate(client)

    job_id = _create_job(client, hr_b)
    apply_resp = client.post(
        f"/api/jobs/{job_id}/apply", headers=auth_headers(candidate), **_apply_payload()
    )
    app_id = apply_resp.json()["id"]

    resp = client.get(f"/api/applications/{app_id}", headers=auth_headers(hr_a))
    assert resp.status_code == 404
