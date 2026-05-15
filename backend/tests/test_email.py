"""Tests for the bulk email endpoint."""

import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JOB_PAYLOAD = {
    "title": "Email Test Job",
    "description": "Used for email tests.",
    "requirements": "Testing",
    "location": "Remote",
    "employment_type": "remote",
}

APPLICATION_PAYLOAD = {
    "resume_text": "Email test applicant.",
    "cover_letter": "Applying for the email test role.",
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
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _create_application(client, hr_token, candidate_token):
    """Create a job and have the candidate apply; return the application ID."""
    job_id = client.post(
        "/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr_token)
    ).json()["id"]
    app = client.post(
        f"/api/jobs/{job_id}/apply",
        json=APPLICATION_PAYLOAD,
        headers=auth_headers(candidate_token),
    )
    assert app.status_code == 201
    return app.json()["id"]


# ---------------------------------------------------------------------------
# Authorization
# ---------------------------------------------------------------------------


def test_bulk_email_requires_hr(client: TestClient, candidate_token: str):
    """Candidate attempting to send bulk email should receive 403."""
    resp = client.post(
        "/api/email/bulk",
        json={
            "application_ids": [str(uuid.uuid4())],
            "subject": "Hello",
            "body": "Message body.",
        },
        headers=auth_headers(candidate_token),
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# 404 paths
# ---------------------------------------------------------------------------


def test_bulk_email_nonexistent_application_ids(client: TestClient, hr_token: str):
    """Passing UUIDs that don't exist in the DB should return 404."""
    resp = client.post(
        "/api/email/bulk",
        json={
            "application_ids": [str(uuid.uuid4()), str(uuid.uuid4())],
            "subject": "Test",
            "body": "Test message body.",
        },
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 503 — AWS credentials not configured (default test environment)
# ---------------------------------------------------------------------------


def test_bulk_email_no_aws_creds_returns_503(client: TestClient):
    """When AWS SES is not configured the endpoint should return 503."""
    hr_token = _register(client, "hr")
    cand_token = _register(client, "candidate")
    app_id = _create_application(client, hr_token, cand_token)

    resp = client.post(
        "/api/email/bulk",
        json={
            "application_ids": [app_id],
            "subject": "Interview Invite",
            "body": "We would like to interview you.",
        },
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 503
    assert "not configured" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 200 — success path with mocked SES
# ---------------------------------------------------------------------------


def test_bulk_email_success_with_mocked_ses(client: TestClient):
    """With send_bulk_email mocked the endpoint should return the summary dict."""
    hr_token = _register(client, "hr")
    cand_token = _register(client, "candidate")
    app_id = _create_application(client, hr_token, cand_token)

    mock_result = {"sent": 1, "failed": 0, "total": 1, "errors": []}
    with patch("app.api.routes.email.send_bulk_email", return_value=mock_result):
        resp = client.post(
            "/api/email/bulk",
            json={
                "application_ids": [app_id],
                "subject": "Interview Invite",
                "body": "We would like to interview you.",
            },
            headers=auth_headers(hr_token),
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["sent"] == 1
    assert data["failed"] == 0
    assert data["total"] == 1


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------


def test_bulk_email_subject_too_long(client: TestClient, hr_token: str):
    """Subject exceeding 200 characters should return 422."""
    resp = client.post(
        "/api/email/bulk",
        json={
            "application_ids": [str(uuid.uuid4())],
            "subject": "x" * 201,
            "body": "Valid body.",
        },
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 422


def test_bulk_email_empty_subject(client: TestClient, hr_token: str):
    """Empty subject should return 422."""
    resp = client.post(
        "/api/email/bulk",
        json={
            "application_ids": [str(uuid.uuid4())],
            "subject": "",
            "body": "Valid body.",
        },
        headers=auth_headers(hr_token),
    )
    assert resp.status_code == 422


def test_bulk_email_cannot_target_other_hr_applications(client: TestClient):
    """HR A must not be able to email candidates who applied to HR B's jobs."""
    hr_a = _register(client, "hr")
    hr_b = _register(client, "hr")
    cand = _register(client, "candidate")

    # Candidate applies to HR B's job — HR A has no ownership here.
    app_id = _create_application(client, hr_b, cand)

    mock_result = {"sent": 1, "failed": 0, "total": 1, "errors": []}
    with patch("app.api.routes.email.send_bulk_email", return_value=mock_result):
        resp = client.post(
            "/api/email/bulk",
            json={
                "application_ids": [app_id],
                "subject": "Phishing attempt",
                "body": "HR A impersonating HR B.",
            },
            headers=auth_headers(hr_a),
        )
    # The ownership filter means no applications are found → 404.
    assert resp.status_code == 404
