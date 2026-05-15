"""FastAPI application entry point."""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from app.api.routes import applications, auth, connections, dashboard, email, jobs, profile, users
from app.config import settings
from app.core.limiter import limiter
from app.core.security import hash_password
from sqlalchemy import text as sa_text

from app.database import SessionLocal, engine

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("skypoint")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed default data on startup. Schema is managed by Alembic."""
    import os
    if os.environ.get("TESTING") != "1":
        seed_data()
    yield


app = FastAPI(
    title="SkyHire API",
    version="1.0.0",
    description="Backend API for the SkyHire application",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach standard security headers to every response."""

    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


# Request logging middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status code, and duration for every request."""

    async def dispatch(self, request: StarletteRequest, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 2)
        logger.info(
            "[%s] %s %s -> %s (%sms)",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        return response


# CORS — origin allowlist from ALLOWED_ORIGINS env var; wildcard disables credentials
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
_wildcard = _allowed_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler — logs the full traceback and returns a safe 500 response."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(email.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(connections.router, prefix="/api")
app.include_router(users.router, prefix="/api")


# Health check
@app.get("/health", tags=["health"])
def health_check():
    """Liveness + readiness probe — checks DB connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(sa_text("SELECT 1"))
        db_status = "healthy"
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        db_status = "unhealthy"

    if db_status != "healthy":
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "version": "1.0.0", "services": {"database": db_status, "api": "healthy"}},
        )
    return {"status": "healthy", "version": "1.0.0", "services": {"database": "healthy", "api": "healthy"}}


@app.get("/", include_in_schema=False)
def root():
    """Root redirect — points consumers to the docs."""
    return {"message": "SkyHire API", "version": "1.0.0", "docs": "/docs"}


# Seed


def seed_data() -> None:
    """Seed default users and sample jobs on first startup."""
    from sqlalchemy.exc import IntegrityError

    from app.models.candidate_profile import CandidateProfile
    from app.models.company import Company
    from app.models.job import Job
    from app.models.user import User

    db = SessionLocal()
    try:
        # ── HR user ──────────────────────────────────────────────────────────
        hr_user = db.query(User).filter(User.email == "hr@test.com").first()
        if not hr_user:
            hr_user = User(
                email="hr@test.com",
                password_hash=hash_password("HR@1234"),
                full_name="Priya Sharma",
                role="hr",
            )
            db.add(hr_user)
            db.flush()

        if not hr_user.company:
            db.add(Company(
                user_id=hr_user.id,
                name="SkyPoint.Ai",
                website="https://skypoint.ai",
                description=(
                    "SkyPoint.Ai is India's leading full-stack financial solutions company. "
                    "We help businesses accept, process and disburse payments and manage their "
                    "finances. Trusted by 8 million+ businesses including Zomato, IRCTC, Ola "
                    "and thousands of startups across India."
                ),
                linkedin_url="https://linkedin.com/company/skypoint-ai",
            ))
            db.flush()

        # ── Candidate user ───────────────────────────────────────────────────
        candidate_user = db.query(User).filter(User.email == "candidate@test.com").first()
        if not candidate_user:
            candidate_user = User(
                email="candidate@test.com",
                password_hash=hash_password("Candidate@1234"),
                full_name="Arjun Mehta",
                role="candidate",
            )
            db.add(candidate_user)
            db.flush()

        if not candidate_user.candidate_profile:
            db.add(CandidateProfile(
                user_id=candidate_user.id,
                headline="Full-Stack Engineer | Python & React",
                skills=["Python", "React", "FastAPI", "PostgreSQL", "Docker"],
                github_url="https://github.com/arjunmehta",
                linkedin_url="https://linkedin.com/in/arjunmehta",
            ))
            db.flush()

        # ── Extra candidate users ────────────────────────────────────────────
        extra_candidates = [
            {
                "email": "riya.kapoor@test.com",
                "full_name": "Riya Kapoor",
                "headline": "Frontend Engineer | React & TypeScript",
                "skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Next.js"],
                "linkedin_url": "https://linkedin.com/in/riyakapoor",
                "github_url": "https://github.com/riyakapoor",
            },
            {
                "email": "vikram.nair@test.com",
                "full_name": "Vikram Nair",
                "headline": "DevOps Engineer | Kubernetes & AWS",
                "skills": ["Kubernetes", "AWS", "Terraform", "Docker", "Python", "Prometheus"],
                "linkedin_url": "https://linkedin.com/in/vikramnair",
                "github_url": "https://github.com/vikramnair",
            },
            {
                "email": "ananya.singh@test.com",
                "full_name": "Ananya Singh",
                "headline": "Data Scientist | ML & NLP",
                "skills": ["Python", "Machine Learning", "NLP", "TensorFlow", "SQL", "Pandas"],
                "linkedin_url": "https://linkedin.com/in/ananyasingh",
                "portfolio_url": "https://ananyasingh.dev",
            },
            {
                "email": "rohan.desai@test.com",
                "full_name": "Rohan Desai",
                "headline": "Android Engineer | Kotlin & Jetpack",
                "skills": ["Android", "Kotlin", "Java", "MVVM", "Jetpack", "REST APIs"],
                "linkedin_url": "https://linkedin.com/in/rohandesai",
                "github_url": "https://github.com/rohandesai",
            },
            {
                "email": "priya.iyer@test.com",
                "full_name": "Priya Iyer",
                "headline": "Product Manager | Fintech & Growth",
                "skills": ["Product Strategy", "SQL", "A/B Testing", "Figma", "Mixpanel", "Agile"],
                "linkedin_url": "https://linkedin.com/in/priyaiyer",
                "portfolio_url": "https://priyaiyer.notion.site",
            },
            {
                "email": "karan.malhotra@test.com",
                "full_name": "Karan Malhotra",
                "headline": "Backend Engineer | Go & Distributed Systems",
                "skills": ["Go", "Python", "Kafka", "PostgreSQL", "gRPC", "Docker", "Redis"],
                "linkedin_url": "https://linkedin.com/in/karanmalhotra",
                "github_url": "https://github.com/karanmalhotra",
            },
            {
                "email": "sneha.joshi@test.com",
                "full_name": "Sneha Joshi",
                "headline": "Technical Writer | Developer Docs & APIs",
                "skills": ["Technical Writing", "Markdown", "REST APIs", "Python", "Postman", "Git"],
                "linkedin_url": "https://linkedin.com/in/snehajoshi",
                "portfolio_url": "https://snehajoshi.dev/portfolio",
            },
            {
                "email": "aditya.rao@test.com",
                "full_name": "Aditya Rao",
                "headline": "Full-Stack Engineer | Node.js & React",
                "skills": ["Node.js", "React", "TypeScript", "MongoDB", "GraphQL", "AWS"],
                "linkedin_url": "https://linkedin.com/in/adityarao",
                "github_url": "https://github.com/adityarao",
            },
            {
                "email": "meera.pillai@test.com",
                "full_name": "Meera Pillai",
                "headline": "Business Analyst | Payments & Strategy",
                "skills": ["Excel", "SQL", "Tableau", "Business Analysis", "Financial Modelling", "PowerPoint"],
                "linkedin_url": "https://linkedin.com/in/meerapillai",
            },
            {
                "email": "siddharth.bose@test.com",
                "full_name": "Siddharth Bose",
                "headline": "ML Engineer | MLOps & Model Deployment",
                "skills": ["Python", "MLflow", "PySpark", "TensorFlow", "Docker", "Kubernetes", "SQL"],
                "linkedin_url": "https://linkedin.com/in/siddharthbose",
                "github_url": "https://github.com/siddharthbose",
            },
            {
                "email": "tanya.sharma@test.com",
                "full_name": "Tanya Sharma",
                "headline": "iOS Engineer | Swift & SwiftUI",
                "skills": ["Swift", "SwiftUI", "iOS", "Xcode", "REST APIs", "CoreData", "Git"],
                "linkedin_url": "https://linkedin.com/in/tanyasharma",
                "github_url": "https://github.com/tanyasharma",
            },
            {
                "email": "nikhil.verma@test.com",
                "full_name": "Nikhil Verma",
                "headline": "Site Reliability Engineer | AWS & Observability",
                "skills": ["AWS", "Python", "Bash", "Prometheus", "Grafana", "ELK", "Terraform"],
                "linkedin_url": "https://linkedin.com/in/nikhilverma",
                "github_url": "https://github.com/nikhilverma",
            },
            {
                "email": "divya.menon@test.com",
                "full_name": "Divya Menon",
                "headline": "UX Designer | Figma & Design Systems",
                "skills": ["Figma", "UI/UX Design", "Tailwind CSS", "Prototyping", "User Research", "SASS"],
                "linkedin_url": "https://linkedin.com/in/divyamenon",
                "portfolio_url": "https://divyamenon.design",
            },
        ]

        for c in extra_candidates:
            existing = db.query(User).filter(User.email == c["email"]).first()
            if not existing:
                new_user = User(
                    email=c["email"],
                    password_hash=hash_password("Candidate@1234"),
                    full_name=c["full_name"],
                    role="candidate",
                )
                db.add(new_user)
                db.flush()
                db.add(CandidateProfile(
                    user_id=new_user.id,
                    headline=c["headline"],
                    skills=c["skills"],
                    linkedin_url=c.get("linkedin_url"),
                    github_url=c.get("github_url"),
                    portfolio_url=c.get("portfolio_url"),
                ))
                db.flush()

        # ── Sample jobs ──────────────────────────────────────────────────────
        sample_jobs = [
            {
                "title": "Senior Software Engineer — Backend",
                "description": (
                    "We are looking for a Senior Software Engineer to join our Payments Infrastructure "
                    "team in Bangalore. You will own the design and delivery of high-throughput, "
                    "low-latency microservices that process millions of transactions daily.\n\n"
                    "What you will do:\n"
                    "• Architect and build distributed backend services using Python/Go\n"
                    "• Collaborate with product managers and frontend engineers on API contracts\n"
                    "• Drive code reviews, set engineering best practices, and mentor junior engineers\n"
                    "• Own reliability targets (SLA/SLO) for your services — on-call participation expected\n"
                    "• Work closely with the Data Engineering team to instrument observability pipelines\n\n"
                    "Why SkyPoint.Ai:\n"
                    "We move fast, ship to production daily, and believe engineers should have end-to-end "
                    "ownership. You will work on systems that directly impact how India transacts."
                ),
                "requirements": (
                    "• 4–7 years of backend engineering experience\n"
                    "• Proficiency in Python or Go; working knowledge of the other is a plus\n"
                    "• Strong fundamentals in distributed systems, database design, and caching strategies\n"
                    "• Experience with Kafka or RabbitMQ for event-driven architectures\n"
                    "• Familiarity with AWS or GCP — EKS/GKE, RDS, Redis\n"
                    "• Experience with SQL (PostgreSQL preferred) and NoSQL (MongoDB/DynamoDB)\n"
                    "• Bachelor's or Master's degree in Computer Science or equivalent"
                ),
                "location": "Bangalore, Karnataka",
                "employment_type": "full_time",
                "salary_range": "₹30L – ₹55L / year",
                "skills": ["Python", "Go", "Kafka", "PostgreSQL", "AWS", "Redis", "Docker", "Kubernetes"],
            },
            {
                "title": "Product Manager — Growth",
                "description": (
                    "SkyPoint.Ai's Growth team is looking for a sharp, data-driven Product Manager to "
                    "own the merchant onboarding and activation funnel. You will define the roadmap "
                    "for products that help new merchants go live in minutes and see their first "
                    "successful payment.\n\n"
                    "What you will do:\n"
                    "• Define and own the product vision for merchant activation — from sign-up to first ₹1\n"
                    "• Run continuous A/B experiments on the onboarding flow to improve activation rates\n"
                    "• Work with Design, Engineering, and Business teams to ship features every 2 weeks\n"
                    "• Analyse funnel drop-offs using Mixpanel/Amplitude and translate insights into hypotheses\n"
                    "• Represent the voice of the merchant — conduct 10+ customer interviews per quarter\n\n"
                    "This is a high-visibility role with direct exposure to the founding team."
                ),
                "requirements": (
                    "• 3–6 years of product management experience at a consumer-tech or fintech company\n"
                    "• Strong analytical skills — comfortable writing SQL queries to pull your own data\n"
                    "• Proven track record of shipping 0→1 products or meaningful feature improvements\n"
                    "• Experience with experimentation frameworks (A/B testing, multivariate tests)\n"
                    "• Excellent written and verbal communication skills in English\n"
                    "• MBA from a tier-1 institution preferred but not mandatory"
                ),
                "location": "Mumbai, Maharashtra",
                "employment_type": "full_time",
                "salary_range": "₹35L – ₹60L / year",
                "skills": ["Product Strategy", "SQL", "A/B Testing", "Figma", "Mixpanel", "Agile", "Roadmapping"],
            },
            {
                "title": "Data Scientist — Risk & Fraud",
                "description": (
                    "Join SkyPoint.Ai's Risk Intelligence team and build ML models that protect millions "
                    "of merchants and their customers from fraud. You will work on one of India's richest "
                    "financial datasets to develop real-time scoring systems deployed at 10,000+ TPS.\n\n"
                    "What you will do:\n"
                    "• Build, train, and deploy fraud detection models (gradient boosting, neural networks)\n"
                    "• Design feature engineering pipelines on streaming data using Spark and Flink\n"
                    "• Collaborate with the engineering team to productionise models via model-serving APIs\n"
                    "• Monitor model drift and retrain periodically using MLflow pipelines\n"
                    "• Present findings and model performance to senior leadership on a monthly basis\n\n"
                    "Impact: Your models will prevent crores of rupees in fraud every month."
                ),
                "requirements": (
                    "• 2–5 years of experience in applied ML or data science in a production environment\n"
                    "• Strong Python skills — pandas, scikit-learn, XGBoost, PyTorch or TensorFlow\n"
                    "• Hands-on experience with feature stores, model registries, and MLOps tooling\n"
                    "• Proficiency in SQL; experience with PySpark is a strong plus\n"
                    "• Familiarity with real-time streaming systems (Kafka, Flink) preferred\n"
                    "• M.Tech / M.S. in Statistics, Computer Science, or related field preferred"
                ),
                "location": "Bangalore, Karnataka",
                "employment_type": "full_time",
                "salary_range": "₹25L – ₹45L / year",
                "skills": ["Python", "Machine Learning", "SQL", "PySpark", "TensorFlow", "MLflow", "Kafka"],
            },
            {
                "title": "Frontend Engineer — React",
                "description": (
                    "We are hiring a Frontend Engineer to join our Checkout & Payment UX team. "
                    "You will build the payment experiences used by hundreds of millions of end-users "
                    "across India — every millisecond of render time and every pixel of UI matters here.\n\n"
                    "What you will do:\n"
                    "• Build and optimise the SkyPoint.Ai Checkout SDK and Dashboard in React + TypeScript\n"
                    "• Work with designers to implement pixel-perfect, accessible UI components\n"
                    "• Own Core Web Vitals targets — LCP, FID, CLS across our web properties\n"
                    "• Write comprehensive unit and integration tests (Jest, React Testing Library)\n"
                    "• Contribute to our internal design system and component library\n\n"
                    "You will see your code used by millions of real users within weeks of joining."
                ),
                "requirements": (
                    "• 2–5 years of frontend development experience\n"
                    "• Expert-level React.js and TypeScript skills\n"
                    "• Deep understanding of browser rendering, performance profiling, and bundle optimisation\n"
                    "• Strong CSS skills — Tailwind CSS, CSS Modules, or styled-components\n"
                    "• Experience with testing frameworks: Jest and React Testing Library\n"
                    "• Familiarity with Webpack/Vite, CI/CD pipelines, and Git workflows"
                ),
                "location": "Bangalore, Karnataka",
                "employment_type": "full_time",
                "salary_range": "₹20L – ₹40L / year",
                "skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Jest", "Vite", "GraphQL"],
            },
            {
                "title": "DevOps / Platform Engineer",
                "description": (
                    "SkyPoint.Ai's Platform Engineering team is looking for a DevOps engineer to help us "
                    "scale our infrastructure to handle India's payment peaks — think Diwali sales, "
                    "IPO subscriptions, and GST filing deadlines.\n\n"
                    "What you will do:\n"
                    "• Manage and scale our Kubernetes clusters on AWS EKS — 500+ microservices\n"
                    "• Build and maintain CI/CD pipelines using Jenkins, ArgoCD, and GitHub Actions\n"
                    "• Implement infrastructure-as-code using Terraform and Helm charts\n"
                    "• Own the observability stack — Prometheus, Grafana, ELK, and PagerDuty alerting\n"
                    "• Drive cost optimisation initiatives on AWS (currently $X M/month in spend)\n"
                    "• Participate in incident response and post-mortem culture"
                ),
                "requirements": (
                    "• 3–6 years of experience in DevOps, SRE, or platform engineering\n"
                    "• Strong Kubernetes expertise — CKA certification is a strong plus\n"
                    "• Proficiency in Terraform, Helm, and infrastructure-as-code best practices\n"
                    "• Hands-on AWS experience — EC2, EKS, RDS, S3, CloudFront, IAM\n"
                    "• Scripting in Python or Bash for automation\n"
                    "• Experience with monitoring stacks: Prometheus, Grafana, ELK or Datadog"
                ),
                "location": "Pune, Maharashtra",
                "employment_type": "full_time",
                "salary_range": "₹22L – ₹42L / year",
                "skills": ["Kubernetes", "AWS", "Terraform", "Docker", "Jenkins", "Prometheus", "Python", "Bash"],
            },
            {
                "title": "Business Analyst — Partnerships",
                "description": (
                    "We are looking for a sharp Business Analyst to join our Strategic Partnerships team "
                    "in Mumbai. You will work directly with banks, NBFCs, and payment networks to drive "
                    "integrations that expand SkyPoint.Ai's payment method coverage across India.\n\n"
                    "What you will do:\n"
                    "• Build detailed financial models, market sizing decks, and partnership proposals\n"
                    "• Analyse transaction data to identify growth opportunities with existing partners\n"
                    "• Coordinate with technical and legal teams to close integration agreements\n"
                    "• Track partnership KPIs and present monthly business reviews to leadership\n"
                    "• Research competitive landscape — payment processors, neo-banks, UPI players"
                ),
                "requirements": (
                    "• 2–4 years of experience in business analysis, consulting, or investment banking\n"
                    "• Advanced Excel/Sheets modelling skills; experience with SQL is a plus\n"
                    "• Strong presentation skills — ability to create compelling decks in PowerPoint/Slides\n"
                    "• Understanding of the Indian payments ecosystem — UPI, IMPS, cards, BNPL\n"
                    "• MBA from a premier institution preferred\n"
                    "• Excellent written communication and stakeholder management skills"
                ),
                "location": "Mumbai, Maharashtra",
                "employment_type": "full_time",
                "salary_range": "₹15L – ₹28L / year",
                "skills": ["Excel", "SQL", "PowerPoint", "Business Analysis", "Financial Modelling", "Tableau"],
            },
            {
                "title": "Mobile Engineer — Android",
                "description": (
                    "SkyPoint.Ai's Mobile team is building the next generation of payment experiences on "
                    "Android — from the merchant-facing POS app to the SkyPoint.Ai Payment Gateway SDK "
                    "embedded in thousands of third-party apps.\n\n"
                    "What you will do:\n"
                    "• Build and maintain the SkyPoint.Ai Android SDK used by 3M+ merchant apps\n"
                    "• Own the SkyPoint.Ai Dashboard Android app from architecture to release\n"
                    "• Write clean, testable Kotlin code following MVVM and Clean Architecture patterns\n"
                    "• Optimise app performance — startup time, memory usage, and battery impact\n"
                    "• Work with the backend team to design efficient mobile APIs"
                ),
                "requirements": (
                    "• 3–5 years of Android development experience\n"
                    "• Expert-level Kotlin skills; Java knowledge is a plus\n"
                    "• Strong understanding of MVVM, Clean Architecture, and Jetpack components\n"
                    "• Experience publishing and maintaining apps on the Google Play Store\n"
                    "• Familiarity with Retrofit, Coroutines, Room, and Dagger/Hilt\n"
                    "• Knowledge of Android security best practices is highly desirable"
                ),
                "location": "Bangalore, Karnataka",
                "employment_type": "full_time",
                "salary_range": "₹22L – ₹40L / year",
                "skills": ["Android", "Kotlin", "Java", "MVVM", "Jetpack", "REST APIs", "Git"],
            },
            {
                "title": "Technical Writer — Developer Docs",
                "description": (
                    "SkyPoint.Ai's Developer Experience team is looking for a Technical Writer to own our "
                    "API documentation, integration guides, and developer tutorials. Our docs are read "
                    "by 500,000+ developers every month — you will directly impact how quickly they "
                    "can integrate and go live.\n\n"
                    "What you will do:\n"
                    "• Write, review, and maintain API reference docs, quickstart guides, and tutorials\n"
                    "• Work with engineering teams to document new APIs before launch\n"
                    "• Build code samples in Python, Node.js, Java, and PHP for all major SDKs\n"
                    "• Audit existing docs for accuracy, completeness, and developer experience\n"
                    "• Own the developer docs site structure and information architecture"
                ),
                "requirements": (
                    "• 2–4 years of technical writing experience, preferably for developer-facing products\n"
                    "• Ability to read and write basic code in at least 2 languages (Python, JS, Java)\n"
                    "• Experience with docs-as-code workflows — Markdown, Git, static site generators\n"
                    "• Strong command of English with excellent clarity and conciseness\n"
                    "• Familiarity with REST APIs — ability to test endpoints using Postman/cURL\n"
                    "• Prior experience with OpenAPI/Swagger specifications is a strong plus"
                ),
                "location": "Remote",
                "employment_type": "remote",
                "salary_range": "₹12L – ₹22L / year",
                "skills": ["Technical Writing", "Markdown", "REST APIs", "Python", "JavaScript", "Git", "Postman"],
            },
        ]

        for job_data in sample_jobs:
            existing = db.query(Job).filter(Job.title == job_data["title"]).first()
            if not existing:
                job = Job(created_by=hr_user.id, **job_data)
                db.add(job)

        db.commit()
        logger.info("Seed data applied — %d jobs checked.", len(sample_jobs))
    except IntegrityError:
        db.rollback()
        logger.info("Seed skipped — another worker already seeded the database.")
    finally:
        db.close()
