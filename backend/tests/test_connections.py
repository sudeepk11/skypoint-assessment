"""Tests for the connections (invite) system."""

import uuid

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JOB_PAYLOAD = {
    "title": "Connections Test Job",
    "description": "Used for connections tests.",
    "requirements": "Testing",
    "location": "Remote",
    "employment_type": "remote",
}


def _register(client, role):
    """Register a user and return {token, id}."""
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
    token = resp.json()["access_token"]
    user_id = client.get("/api/auth/me", headers=auth_headers(token)).json()["id"]
    return {"token": token, "id": user_id}


# ---------------------------------------------------------------------------
# Candidate listing
# ---------------------------------------------------------------------------


def test_hr_can_list_candidates(client: TestClient):
    """HR user should receive a list of candidates."""
    hr = _register(client, "hr")
    _register(client, "candidate")  # ensure at least one candidate exists
    resp = client.get("/api/connections/candidates", headers=auth_headers(hr["token"]))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert all(u["id"] for u in resp.json())


def test_candidate_cannot_list_candidates(client: TestClient):
    """Candidate should receive 403 when trying to list candidates."""
    cand = _register(client, "candidate")
    resp = client.get("/api/connections/candidates", headers=auth_headers(cand["token"]))
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Sending invites
# ---------------------------------------------------------------------------


def test_hr_can_send_invite(client: TestClient):
    """HR user should be able to send a job invite to a candidate."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    resp = client.post(
        f"/api/connections/{cand['id']}",
        json={"message": "We'd like you to apply!"},
        headers=auth_headers(hr["token"]),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["requester"]["id"] == hr["id"]
    assert data["receiver"]["id"] == cand["id"]


def test_hr_can_send_invite_with_job(client: TestClient):
    """HR user should be able to attach a specific job to the invite."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")
    job_id = client.post(
        "/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr["token"])
    ).json()["id"]

    resp = client.post(
        f"/api/connections/{cand['id']}",
        json={"job_id": job_id, "message": "Check out this role!"},
        headers=auth_headers(hr["token"]),
    )
    assert resp.status_code == 201
    assert resp.json()["job_id"] == job_id


def test_duplicate_invite_for_same_job_blocked(client: TestClient):
    """Sending the same invite (same HR + candidate + job) twice should return 409."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")
    job_id = client.post(
        "/api/jobs", json=JOB_PAYLOAD, headers=auth_headers(hr["token"])
    ).json()["id"]

    client.post(
        f"/api/connections/{cand['id']}",
        json={"job_id": job_id},
        headers=auth_headers(hr["token"]),
    )
    resp = client.post(
        f"/api/connections/{cand['id']}",
        json={"job_id": job_id},
        headers=auth_headers(hr["token"]),
    )
    assert resp.status_code == 409


def test_candidate_cannot_send_invite(client: TestClient):
    """Candidate should receive 403 when attempting to send an invite."""
    cand1 = _register(client, "candidate")
    cand2 = _register(client, "candidate")
    resp = client.post(
        f"/api/connections/{cand2['id']}",
        json={},
        headers=auth_headers(cand1["token"]),
    )
    assert resp.status_code == 403


def test_invite_to_nonexistent_candidate_returns_404(client: TestClient):
    """Invite to an ID that doesn't exist should return 404."""
    hr = _register(client, "hr")
    fake_id = str(uuid.uuid4())
    resp = client.post(
        f"/api/connections/{fake_id}",
        json={},
        headers=auth_headers(hr["token"]),
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Listing invites
# ---------------------------------------------------------------------------


def test_candidate_sees_pending_invites(client: TestClient):
    """Candidate should see invites addressed to them in the pending list."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    client.post(
        f"/api/connections/{cand['id']}",
        json={"message": "Join us!"},
        headers=auth_headers(hr["token"]),
    )

    resp = client.get("/api/connections/pending", headers=auth_headers(cand["token"]))
    assert resp.status_code == 200
    invites = resp.json()
    assert any(inv["requester"]["id"] == hr["id"] for inv in invites)


def test_hr_sees_sent_invites(client: TestClient):
    """HR user should see the invites they sent in the sent list."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    client.post(
        f"/api/connections/{cand['id']}",
        json={"message": "Join us!"},
        headers=auth_headers(hr["token"]),
    )

    resp = client.get("/api/connections/sent", headers=auth_headers(hr["token"]))
    assert resp.status_code == 200
    sent = resp.json()
    assert any(inv["receiver"]["id"] == cand["id"] for inv in sent)


# ---------------------------------------------------------------------------
# Accepting invites
# ---------------------------------------------------------------------------


def test_candidate_accepts_invite(client: TestClient):
    """Candidate accepting a pending invite should set its status to accepted."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.patch(
        f"/api/connections/{conn_id}/accept",
        headers=auth_headers(cand["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


def test_non_receiver_cannot_accept(client: TestClient):
    """A user who is not the receiver should receive 403 when accepting."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")
    other_cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.patch(
        f"/api/connections/{conn_id}/accept",
        headers=auth_headers(other_cand["token"]),
    )
    assert resp.status_code == 403


def test_accepting_already_accepted_invite_returns_400(client: TestClient):
    """Accepting an already-accepted invite should return 400."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    client.patch(f"/api/connections/{conn_id}/accept", headers=auth_headers(cand["token"]))

    resp = client.patch(
        f"/api/connections/{conn_id}/accept",
        headers=auth_headers(cand["token"]),
    )
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Declining invites
# ---------------------------------------------------------------------------


def test_candidate_declines_invite(client: TestClient):
    """Candidate declining a pending invite should set its status to declined."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.patch(
        f"/api/connections/{conn_id}/decline",
        headers=auth_headers(cand["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "declined"


def test_non_receiver_cannot_decline(client: TestClient):
    """A user who is not the receiver should receive 403 when declining."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")
    other = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.patch(
        f"/api/connections/{conn_id}/decline",
        headers=auth_headers(other["token"]),
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Accepted connections list
# ---------------------------------------------------------------------------


def test_accepted_invite_visible_in_connections_list(client: TestClient):
    """An accepted invite should appear in both parties' connections lists."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    client.patch(f"/api/connections/{conn_id}/accept", headers=auth_headers(cand["token"]))

    hr_list = client.get("/api/connections", headers=auth_headers(hr["token"])).json()
    cand_list = client.get("/api/connections", headers=auth_headers(cand["token"])).json()

    assert any(c["id"] == conn_id for c in hr_list)
    assert any(c["id"] == conn_id for c in cand_list)


# ---------------------------------------------------------------------------
# Deleting invites
# ---------------------------------------------------------------------------


def test_requester_can_delete_invite(client: TestClient):
    """The HR user who sent the invite should be able to delete it."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.delete(
        f"/api/connections/{conn_id}",
        headers=auth_headers(hr["token"]),
    )
    assert resp.status_code == 204


def test_non_party_cannot_delete_invite(client: TestClient):
    """A user unrelated to the invite should receive 403 when trying to delete it."""
    hr = _register(client, "hr")
    cand = _register(client, "candidate")
    stranger = _register(client, "hr")

    conn_id = client.post(
        f"/api/connections/{cand['id']}",
        json={},
        headers=auth_headers(hr["token"]),
    ).json()["id"]

    resp = client.delete(
        f"/api/connections/{conn_id}",
        headers=auth_headers(stranger["token"]),
    )
    assert resp.status_code == 403
