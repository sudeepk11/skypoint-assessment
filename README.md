# Skypoint Job Portal

> Full-stack recruitment platform built for modern teams — powered by Skypoint AI

![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

---

## Project Overview

A full-stack Applicant Tracking System (ATS) with two distinct user roles — **HR** and **Candidate**. HR teams can post jobs, review applications, and manage the full hiring pipeline. Candidates can browse open positions, apply, and track their application status in real time.

Key highlights:
- Role-based access control — HR and Candidate roles with separate dashboards and permissions
- **Bulk Email** — HR can select multiple candidates and send templated emails via AWS SES
- Fully Dockerized — runs with a single command, zero manual setup
- 24 backend tests covering auth, job CRUD, and application workflows

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                    │
│                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │
│  │  Frontend   │    │   Backend   │    │   DB    │ │
│  │  React/Vite │───▶│  FastAPI    │───▶│Postgres │ │
│  │  nginx:80   │    │  port 8000  │    │port 5432│ │
│  │  host: 3000 │    │             │    │         │ │
│  └─────────────┘    └──────┬──────┘    └─────────┘ │
│         ▲                  │                        │
│         │           /api/* proxied                  │
│         └───────────────────                        │
└─────────────────────────────────────────────────────┘

External Services (optional):
  - AWS SES  → Bulk email notifications
```

- **Frontend**: React 18 + Vite + TypeScript, served by nginx. All `/api/*` requests are proxied to the backend.
- **Backend**: FastAPI (Python 3.11) with SQLAlchemy ORM. Auto-creates DB tables and seeds test data on first startup.
- **Database**: PostgreSQL 15 with a named Docker volume for persistence across restarts.

---

## How to Run

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Production (assessors / deployment)

```bash
# 1. Clone the repository
git clone https://github.com/sudeepk11/skypoint-assessment.git
cd skypoint-assessment

# 2. Copy the environment file
cp .env.example .env

# 3. Start the application
docker compose up --build

# 4. Open the app
open http://localhost:3000
```

Serves a compiled, optimised build via **nginx**. No hot reload.

> **Note:** The first `docker compose up --build` will take 2–3 minutes to pull images and install dependencies. Subsequent runs are much faster.

### Development (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Runs the Vite dev server with live reload on **http://localhost:3000**.

The application is accessible at **http://localhost:3000**

---

## Test Credentials

The database is automatically seeded with the following test accounts on first startup:

| Role | Email | Password |
|------|-------|----------|
| **HR** | `hr@test.com` | `HR@1234` |
| **Candidate** | `candidate@test.com` | `Candidate@1234` |

8 sample job postings are also pre-loaded (Senior Software Engineer, Product Manager, Data Scientist, Frontend Engineer, DevOps Engineer, Business Analyst, Android Engineer, Technical Writer).

---

## Feature Walkthrough

### HR Role

| Feature | How to Access |
|---------|--------------|
| Dashboard with KPIs & charts | Login → auto-redirected to `/hr/dashboard` |
| View & manage all jobs | Sidebar → "Manage Jobs" |
| Create a new job posting | "Manage Jobs" → "Post New Job" button |
| Edit or close a job | Jobs table → pencil / toggle icon |
| Delete a job | Jobs table → trash icon → confirm dialog |
| View all applications | Sidebar → "Applications" |
| Filter applications by job or status | Applications page → filter toolbar |
| Change application status | Applications → "View" → Status dropdown |
| **Bulk Email** | Applications → select candidates → "Send Bulk Email" (requires AWS SES config) |
| Talent Network — browse candidates | Sidebar → "Talent Network" |
| Send job invite to a candidate | Talent Network → "Invite" button |

### Candidate Role

| Feature | How to Access |
|---------|--------------|
| Dashboard with application stats | Login → auto-redirected to `/candidate/dashboard` |
| Browse open jobs | Sidebar → "Browse Jobs" or dashboard CTA |
| Search & filter jobs | Job Board → search bar + type/location filters |
| Apply to a job | Job Detail → "Apply Now" → fill resume + cover letter |
| Track application status | Sidebar → "My Applications" |
| View HR job invitations | Sidebar → "Connections" |
| Accept or decline an invitation | Connections → pending invite row |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend | FastAPI 0.111, Python 3.11, Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL 15 |
| Email | AWS SES via boto3 |
| Testing | pytest, httpx |
| Containerisation | Docker, Docker Compose |

---

## Running Tests

```bash
# Run backend tests (while containers are up)
docker compose exec backend pytest tests/ -v

# Or run with short tracebacks
docker compose exec backend pytest tests/ -v --tb=short
```

**24 tests** covering:
- `test_auth.py` — Registration, login, duplicate email, wrong password, JWT protection
- `test_jobs.py` — CRUD, role enforcement (HR-only), status toggle
- `test_applications.py` — Apply, duplicate block, closed-job block, status updates, visibility rules

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (auto-set) | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret |
| `AWS_ACCESS_KEY_ID` | For bulk email | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | For bulk email | AWS credentials |
| `AWS_SES_REGION` | For bulk email | SES region (default: `us-east-1`) |
| `AWS_SES_FROM_EMAIL` | For bulk email | Verified sender email |

---

## Known Limitations

- **Bulk email** requires AWS SES credentials. Without them, clicking "Send Emails" shows: *"Email service not configured — please add AWS SES credentials to your .env file."* The UI and backend code are fully implemented.
- Resume upload is text-based (paste resume content). File upload (PDF/DOCX) is out of scope for this assessment.
