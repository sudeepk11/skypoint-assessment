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

APPLICATION_PAYLOAD = {
    "resume_text": "5 years of QA experience with pytest and Selenium.",
    "cover_letter": "I am excited to apply for this role.",
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
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["status"] == "pending"


def test_duplicate_application_blocked(client: TestClient, hr_token: str, candidate_token: str):
    """Applying to the same job twice should return 400."""
    job_id = _create_job(client, hr_token)
    client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    resp = client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
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
    resp = client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 400
    assert "closed" in resp.json()["detail"].lower()


def test_hr_views_all_applications(client: TestClient, hr_token: str, candidate_token: str):
    """HR should be able to list all applications."""
    job_id = _create_job(client, hr_token)
    client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    resp = client.get("/api/applications", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_candidate_views_own_applications(
    client: TestClient, hr_token: str, candidate_token: str
):
    """A candidate should only see their own applications."""
    job_id = _create_job(client, hr_token)
    client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    resp = client.get("/api/applications", headers=auth_headers(candidate_token))
    assert resp.status_code == 200
    apps = resp.json()
    # Get the candidate's user ID from the token
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
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
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
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
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
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    app_id = apply_resp.json()["id"]

    resp = client.get(f"/api/applications/{app_id}", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    assert resp.json()["id"] == app_id
