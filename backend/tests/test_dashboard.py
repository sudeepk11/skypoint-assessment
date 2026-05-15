"""Tests for HR and candidate dashboard summary endpoints."""

import uuid

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JOB_PAYLOAD = {
    "title": "Dashboard Test Job",
    "description": "Used for dashboard tests.",
    "requirements": "Testing",
    "location": "Remote",
    "employment_type": "remote",
}

APPLICATION_PAYLOAD = {
    "resume_text": "Experienced tester.",
    "cover_letter": "I would like to apply.",
}


def _register(client, role):
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
    assert resp.status_code == 201
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# HR dashboard
# ---------------------------------------------------------------------------


def test_hr_dashboard_returns_correct_structure(client: TestClient, hr_token: str):
    """HR dashboard should return the expected top-level keys."""
    resp = client.get("/api/dashboard/hr", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    data = resp.json()
    for key in (
        "total_jobs",
        "open_jobs",
        "total_applications",
        "shortlisted_this_week",
        "applications_by_status",
        "recent_applications",
        "jobs_performance",
    ):
        assert key in data, f"Missing key: {key}"


def test_hr_dashboard_forbidden_for_candidate(client: TestClient, candidate_token: str):
    """Candidate should receive 403 when accessing the HR dashboard."""
    resp = client.get("/api/dashboard/hr", headers=auth_headers(candidate_token))
    assert resp.status_code == 403


def test_hr_dashboard_metrics_reflect_data(client: TestClient):
    """HR dashboard counts should match the actual jobs and applications created."""
    hr_token = _register(client, "hr")
    candidate_token = _register(client, "candidate")

    # Create two jobs.
    for _ in range(2):
        r = client.post("/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr_token))
        assert r.status_code == 201

    # Apply to the first job.
    jobs = client.get("/api/jobs").json()
    # Find a job created by our HR user by fetching via /api/jobs (open jobs list).
    job_ids = [j["id"] for j in jobs]
    client.post(
        f"/api/jobs/{job_ids[0]}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )

    resp = client.get("/api/dashboard/hr", headers=auth_headers(hr_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_jobs"] >= 2
    assert data["open_jobs"] >= 2
    assert data["total_applications"] >= 1


# ---------------------------------------------------------------------------
# Candidate dashboard
# ---------------------------------------------------------------------------


def test_candidate_dashboard_returns_correct_structure(
    client: TestClient, candidate_token: str
):
    """Candidate dashboard should return the expected top-level keys."""
    resp = client.get("/api/dashboard/candidate", headers=auth_headers(candidate_token))
    assert resp.status_code == 200
    data = resp.json()
    for key in ("total_applied", "pending", "shortlisted", "rejected", "recent_applications"):
        assert key in data, f"Missing key: {key}"


def test_candidate_dashboard_forbidden_for_hr(client: TestClient, hr_token: str):
    """HR user should receive 403 when accessing the candidate dashboard."""
    resp = client.get("/api/dashboard/candidate", headers=auth_headers(hr_token))
    assert resp.status_code == 403


def test_candidate_dashboard_metrics_reflect_data(client: TestClient):
    """Candidate dashboard counts should reflect their actual applications."""
    hr_token = _register(client, "hr")
    cand_token = _register(client, "candidate")

    job_resp = client.post("/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr_token))
    job_id = job_resp.json()["id"]

    client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(cand_token),
    )

    resp = client.get("/api/dashboard/candidate", headers=auth_headers(cand_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_applied"] == 1
    assert data["pending"] == 1
    assert data["shortlisted"] == 0
    assert data["rejected"] == 0
    assert len(data["recent_applications"]) == 1
