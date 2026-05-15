"""Tests for job posting endpoints."""

import pytest
from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JOB_PAYLOAD = {
    "title": "Backend Engineer",
    "description": "Build APIs and services.",
    "requirements": "Python, FastAPI, PostgreSQL",
    "location": "Remote",
    "employment_type": "remote",
    "salary_range": "$100,000 - $130,000",
}


def _create_job(client, hr_token, payload=None):
    """Helper: create a job as HR and return the response."""
    return client.post(
        "/api/jobs",
        json=payload or JOB_PAYLOAD,
        headers=auth_headers(hr_token),
    )


def test_hr_create_job(client: TestClient, hr_token: str):
    """HR user should be able to create a job and receive 201."""
    resp = _create_job(client, hr_token)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == JOB_PAYLOAD["title"]
    assert data["status"] == "open"


def test_candidate_cannot_create_job(client: TestClient, candidate_token: str):
    """Candidate should receive 403 when attempting to create a job."""
    resp = client.post(
        "/api/jobs",
        json=JOB_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 403


def test_list_jobs_public(client: TestClient, hr_token: str):
    """Public endpoint should return open jobs without authentication."""
    _create_job(client, hr_token)
    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_job_detail(client: TestClient, hr_token: str):
    """Retrieving a specific job by ID should return 200."""
    create_resp = _create_job(client, hr_token)
    job_id = create_resp.json()["id"]

    resp = client.get(f"/api/jobs/{job_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == job_id


def test_hr_edit_job(client: TestClient, hr_token: str):
    """HR user should be able to update a job posting."""
    create_resp = _create_job(client, hr_token)
    job_id = create_resp.json()["id"]

    resp = client.put(
        f"/api/jobs/{job_id}",
        json={"title": "Senior Backend Engineer"},
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Senior Backend Engineer"


def test_hr_toggle_job_status(client: TestClient, hr_token: str):
    """HR user should be able to toggle a job's status between open and closed."""
    create_resp = _create_job(client, hr_token)
    job_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/jobs/{job_id}/status",
        json={"status": "closed"},
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"

    resp2 = client.patch(
        f"/api/jobs/{job_id}/status",
        json={"status": "open"},
        headers=auth_headers(hr_token),
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "open"


def test_hr_delete_job(client: TestClient, hr_token: str):
    """HR user should be able to delete a job posting (returns 204)."""
    create_resp = _create_job(client, hr_token)
    job_id = create_resp.json()["id"]

    resp = client.delete(f"/api/jobs/{job_id}", headers=auth_headers(hr_token))
    assert resp.status_code == 204


def test_deleted_job_not_listed(client: TestClient, hr_token: str):
    """A deleted job should not appear in the public job listing."""
    create_resp = _create_job(
        client,
        hr_token,
        {
            **JOB_PAYLOAD,
            "title": "Temporary Job To Delete",
        },
    )
    job_id = create_resp.json()["id"]
    client.delete(f"/api/jobs/{job_id}", headers=auth_headers(hr_token))

    resp = client.get("/api/jobs")
    ids = [j["id"] for j in resp.json()]
    assert job_id not in ids
