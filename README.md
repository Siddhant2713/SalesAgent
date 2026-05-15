<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗ █████╗ ██╗     ███████╗███████╗ █████╗  ██████╗    ║
║   ██╔════╝██╔══██╗██║     ██╔════╝██╔════╝██╔══██╗██╔════╝    ║
║   ███████╗███████║██║     █████╗  ███████╗███████║██║  ███╗   ║
║   ╚════██║██╔══██║██║     ██╔══╝  ╚════██║██╔══██║██║   ██║   ║
║   ███████║██║  ██║███████╗███████╗███████║██║  ██║╚██████╔╝   ║
║   ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝    ║
║                                                               ║
║          AI-Powered Cold Outreach, Done Right                 ║
╚═══════════════════════════════════════════════════════════════╝
```

**Gemini researches your leads. Writes hyper-personalized emails. Sends them. Learns what works.**

[![Python 3.12](https://img.shields.io/badge/python-3.12-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4.svg?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57.svg?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## What Is This?

SalesAgent is a self-hostable cold outreach platform that wires an AI research pipeline directly into your email workflow. Instead of writing one generic email and blasting it at a list, SalesAgent does this for every lead:

1. **Researches the company** — Gemini 2.5 Flash uses live Google Search grounding to find the company's growth stage, recent activity, and pain points.
2. **Writes 3 personalized variants** — friendly, direct, and curiosity-driven — using everything it found.
3. **Shows you the reasoning** — an AI research card displays exactly what Gemini discovered and why it chose a particular angle.
4. **Sends via your own Gmail** — no third-party email providers, no deliverability black boxes.
5. **Tracks replies and follows up** — automatically rotates tone on follow-ups so you're not sending the same energy twice.
6. **Learns over time** — the analytics dashboard breaks down which tone is converting best for your specific lead pool.

This is not a template tool. It is an agent.

---

## Table of Contents

- [Demo & Screenshots](#demo--screenshots)
- [Architecture Deep Dive](#architecture-deep-dive)
- [The AI Pipeline](#the-ai-pipeline)
- [Feature Reference](#feature-reference)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker & Production](#docker--production)
- [Deploying to Render](#deploying-to-render)
- [Deploying to Google Cloud Run](#deploying-to-google-cloud-run)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Rate Limiting](#rate-limiting)
- [Google Sheets Import](#google-sheets-import)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Configuration & Tuning](#configuration--tuning)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Demo & Screenshots

> **Live demo:** Deploy your own instance in ~5 minutes using the Docker or Render instructions below.

The UI follows a deliberate 4-step flow:

```
Upload Leads → Create Campaign → Preview Emails → Send & Track
```

Each screen is a single-page React view served from the same FastAPI process in production. No CDN, no separate frontend server — one container, one port, one deploy.

---

## Architecture Deep Dive

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (React 18 SPA)                        │
│                                                                      │
│  Pages:                Components:                                   │
│  ├── UploadPage         ├── LeadTable (ARIA labels, status badges)   │
│  ├── CampaignPage       ├── EnrichmentCard (AI research display)     │
│  ├── Dashboard          ├── MessagePreview (ARIA tab pattern)        │
│  └── Settings           ├── CampaignSetup / Preview / Sent          │
│                         ├── Sidebar (fixed, 220px)                   │
│  State:                 └── StatsCard                                │
│  ├── AuthContext (JWT)                                               │
│  └── api.js (all fetch calls, auto-logout on 401)                   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTP/JSON  Authorization: Bearer <JWT>
┌───────────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend (Python 3.12)                    │
│                                                                      │
│  Middleware stack (order = execution order):                         │
│  ├── SecurityHeadersMiddleware  (X-Frame-Options, nosniff, CSP)      │
│  ├── CORSMiddleware             (localhost:5173 + RENDER_EXTERNAL_URL)│
│  └── slowapi RateLimitExceeded handler                               │
│                                                                      │
│  Routes:                                                             │
│  ├── /api/auth          register, login (OAuth2PasswordRequestForm)  │
│  ├── /api/user          /me, /settings (GET + PATCH)                 │
│  ├── /api/leads         CRUD + /upload + /manual + /import/sheets    │
│  ├── /api/campaign      generate, send, followup, list, messages     │
│  ├── /api/analytics     summary (TTL-cached 30s), quota              │
│  └── /health            liveness probe for container orchestrators   │
│                                                                      │
│  Auth: JWT (HS256, 24h expiry) + bcrypt password hashing            │
│  Rate limits: slowapi per-IP + custom Gemini token bucket            │
└───┬──────────────────┬────────────────────┬───────────────────────────┘
    │                  │                    │
┌───▼────┐      ┌──────▼──────┐      ┌─────▼──────┐
│SQLite  │      │Gemini 2.5   │      │Gmail SMTP  │
│        │      │Flash        │      │            │
│ORM:    │      │             │      │starttls    │
│SQLAlch.│      │• Enrichment │      │port 587    │
│2.0     │      │  (grounding)│      │            │
│        │      │• Generation │      │Per-user    │
│Fernet- │      │  (schema)   │      │app password│
│encrypt │      │• Follow-ups │      │decrypted   │
│at-rest │      │             │      │in-memory   │
└────────┘      └─────────────┘      └────────────┘
```

### Request Lifecycle

1. Browser sends `Authorization: Bearer <token>` on every non-auth request.
2. `get_current_user` dependency decodes JWT, queries user from DB, injects into route handler.
3. Route handler scopes all DB queries to `user_id == current_user.id` — strict data isolation.
4. On writes: `slowapi` checks per-IP rate limit first. Gemini calls additionally go through `_RateLimiter.acquire()`.
5. Credentials are decrypted from DB using Fernet only when needed (inside service calls), never logged.
6. Responses go through `SecurityHeadersMiddleware` on the way out.

---

## The AI Pipeline

Every campaign generation triggers a two-stage pipeline per lead. Here's what actually happens:

### Stage 1: Company Enrichment (`enrichment_service.py`)

```python
config = types.GenerateContentConfig(
    temperature=0.4,
    max_output_tokens=512,
    tools=[types.Tool(google_search=types.GoogleSearch())],
)
```

Gemini calls the web **live** using Google Search grounding. It searches for the company, reads what it finds, and returns a structured analysis:

```json
{
  "company_stage": "growth_stage",
  "likely_pain_points": ["scaling engineering hiring", "B2B sales cycle too long"],
  "best_hook": "Notion's recent Series C means their sales team is being built from scratch — timing is critical.",
  "tone_recommendation": "curiosity"
}
```

Temperature is 0.4 here — we want factual research, not creative latitude. `response_mime_type="application/json"` is intentionally **not** set because it's incompatible with the `tools` parameter in the Gemini SDK. JSON is parsed manually with markdown fence stripping.

**Enrichment is non-blocking.** If it fails (network error, Gemini 429, bad JSON), the pipeline continues with `{}` and generates emails without context. The system never fails a campaign because of an enrichment error.

### Stage 2: Email Generation (`ai_service.py`)

The enrichment output is injected into the generation prompt. Gemini then produces three email variants using **structured output**:

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_schema=InitialEmailSet,     # Pydantic model
        response_mime_type="application/json",
        temperature=0.7,
        max_output_tokens=2048,
    )
)
```

`InitialEmailSet` is a Pydantic schema that Gemini is contractually bound to follow:

```python
class EmailVariant(BaseModel):
    subject: str  # under 80 chars
    body: str     # under 100 words, no placeholders

class InitialEmailSet(BaseModel):
    friendly: EmailVariant
    direct: EmailVariant
    curiosity: EmailVariant
```

If structured output fails (SDK version mismatch, model capability issue), the system falls back to raw JSON mode with manual parsing and one automatic retry.

### Stage 3: Follow-up Generation

Follow-ups use tone rotation:

| Initial Tone | Follow-up Tone |
|---|---|
| friendly | curiosity |
| direct | friendly |
| curiosity | direct |

The logic is in `tracking_service.py` — 6 lines. Simple works.

### API Call Budget

Each lead costs **2 Gemini API calls** (1 enrichment + 1 generation). A campaign of 20 leads = 40 calls. With the 6-second inter-request delay, that's ~4 minutes. This is communicated in the UI.

---

## Feature Reference

### Lead Management

| Feature | Details |
|---|---|
| CSV Upload | Max 1MB, 500 rows, auto-deduplication by email + user_id, UTF-8-BOM safe |
| Google Sheets Import | Public sheets via CSV export endpoint — no OAuth required |
| Manual Entry | Single lead form with Pydantic EmailStr validation |
| Bulk Select | Checkbox table with "select all" — max 50 per campaign batch |
| Status Tracking | `new` → `contacted` → `replied` state machine |
| Delete | Cascades to messages via SQLAlchemy `cascade="all, delete-orphan"` |

### Campaign Engine

| Feature | Details |
|---|---|
| Generation | Two-stage AI pipeline: enrich then generate |
| Deduplication | Skips leads already in the campaign — safe to re-run |
| Preview | Tab-based UI showing all 3 tone variants per lead |
| AI Research Card | Displays company stage, pain points, best angle, tone recommendation |
| Tone Selection | Choose one tone, send to all leads in the campaign |
| Sending | SMTP via user's Gmail, starttls, per-user credentials |
| Follow-ups | Auto-rotated tone, one follow-up per lead per campaign |
| Quota Guard | Pre-flight check: refuses generation if daily quota insufficient |

### Analytics

| Metric | Description |
|---|---|
| Total Leads | All leads in your account |
| Emails Sent | Initial emails only (not follow-ups) for accurate reply rate |
| Replies | Leads marked "replied" |
| Reply Rate | replies / emails_sent × 100 |
| Tone Stats | Per-tone: sent, replies, reply_rate |
| Best Tone | Highest reply rate tone with non-zero sends |

Analytics are cached for 30 seconds using a TTL decorator (`utils/cache.py`). The cache key hashes only primitive arguments, skipping the DB session.

### Onboarding

First-time users see a 3-step wizard before the main app:

1. **Connect AI** — Gemini API key with format validation (must start with `AIza`, 39 chars)
2. **Connect Gmail** — SMTP credentials with App Password guidance
3. **First Lead** — optional manual entry to see the full flow immediately

The wizard state is tracked in `localStorage` (`salesagent_onboarded`). After completion, users go straight to the main app. If a user already has settings configured, the wizard is skipped entirely.

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.111.0 | Async web framework, automatic OpenAPI docs |
| SQLAlchemy | 2.0.30 | ORM with relationship loading, composite indexes |
| Pydantic | 2.7.1 | Request/response validation, settings management |
| pydantic-settings | 2.2.1 | `.env` file loading |
| google-genai | ≥1.0.0 | Official Gemini SDK |
| google-api-core | 2.19.0 | Google API error types (`ResourceExhausted`) |
| python-jose | 3.3.0 | JWT encoding/decoding (HS256) |
| passlib[bcrypt] | 1.7.4 | Password hashing with bcrypt |
| cryptography | 42.0.8 | Fernet AES-128-CBC + HMAC-SHA256 |
| slowapi | 0.1.9 | Per-IP rate limiting middleware |
| httpx | 0.27.0 | Async HTTP client for Sheets import |
| python-multipart | 0.0.9 | Form data + file upload parsing |
| gunicorn | 22.0.0 | Production WSGI server |
| uvicorn | 0.29.0 | ASGI worker for FastAPI |
| psycopg2-binary | 2.9.9 | PostgreSQL driver (swap `DATABASE_URL` to enable) |
| pytest | 8.2.0 | Test framework |
| pytest-asyncio | 0.23.6 | Async test support |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| React Router DOM | 6.30.3 | Client-side routing (BrowserRouter) |
| Vite | 5.4.21 | Dev server + production build |
| Tailwind CSS | CDN | Utility classes (loaded from CDN in `index.html`) |
| DM Sans | Google Fonts | Primary UI font |
| JetBrains Mono | Google Fonts | Monospace (code previews) |

### Infrastructure

| Tool | Usage |
|---|---|
| Docker | Multi-stage build: Node 20 Alpine (frontend) → Python 3.12 slim (backend) |
| Gunicorn + UvicornWorker | 2 workers, 120s timeout, `--preload` to avoid SQLite init race |
| SQLite | Default database — swap to PostgreSQL with one env var change |
| GitHub Actions | CI: runs full pytest suite on every push and PR |

---

## Prerequisites

| Requirement | Minimum | Notes |
|---|---|---|
| Python | 3.11 | 3.12 recommended (matches Docker base) |
| Node.js | 18 | Required for frontend build only |
| Gmail Account | Any | Must have 2-Step Verification enabled |
| Gemini API Key | Free tier | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| OpenSSL | Any | For generating `SECRET_KEY` |

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/salesagent.git
cd salesagent
```

### 2. Generate secrets

```bash
# JWT signing key — required, no default in production mode
openssl rand -hex 32

# Fernet encryption key — required for credential encryption
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# ── Security (REQUIRED) ──────────────────────────────────────────────────────
SECRET_KEY=<output of openssl rand -hex 32>
ENCRYPTION_KEY=<output of Fernet.generate_key()>

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=sqlite:///../salesagent.db

# ── Optional Server-Level Fallbacks ──────────────────────────────────────────
# Users can configure their own keys in the app Settings page.
# These are only used if a user hasn't set their own.
GEMINI_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_NAME=
```

> **Note:** `SECRET_KEY` has a hardcoded fallback in `config.py` for development convenience, but a warning is logged. Never run in production without setting this explicitly.

### 4. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Backend available at `http://localhost:8000`  
Swagger UI at `http://localhost:8000/api/docs`

### 5. Start the frontend

```bash
# New terminal, from project root
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

The Vite dev server proxies nothing — the frontend calls `http://localhost:8000` directly via `VITE_API_BASE_URL` set in `.env.development`.

### 6. First login

Navigate to `http://localhost:5173`, register an account, and complete the onboarding wizard. Add your Gemini API key and Gmail App Password in Settings.

---

## Docker & Production

### Single-command production stack

```bash
export SECRET_KEY=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

docker-compose up --build
```

The app runs at `http://localhost:8000`.

### What the Docker build does

**Stage 1 (frontend build):**
```dockerfile
FROM node:20-alpine AS frontend-build
# npm ci --silent, then vite build with VITE_API_BASE_URL=""
# Empty base URL = same-origin API calls (no CORS needed in production)
```

**Stage 2 (production backend):**
```dockerfile
FROM python:3.12-slim AS production
# Installs gcc for native deps, then Python packages
# Copies built frontend into ./static/
# Gunicorn with UvicornWorker: 2 workers, preload, 120s timeout
```

The FastAPI app serves the React build from `/static` via a catch-all route:

```python
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
```

This is the SPA fallback — all React Router paths (e.g. `/dashboard`) correctly return `index.html`.

### SQLite persistence

The `docker-compose.yml` mounts a named volume at `/app/data`:

```yaml
volumes:
  - salesagent-data:/app/data
```

The database lives at `/app/data/salesagent.db`. It persists across container restarts and upgrades.

---

## Deploying to Render

Render is the easiest one-click deployment path. The `render.yaml` in the repo root handles everything:

```yaml
services:
  - type: web
    name: salesagent
    runtime: python
    buildCommand: |
      cd frontend && VITE_API_BASE_URL="" npm install && npm run build && cd ..
      cp -r frontend/dist backend/static
      cd backend && pip install -r requirements.txt
    startCommand: cd backend && gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        value: sqlite:///./salesagent.db
```

**Steps:**

1. Fork this repo
2. Connect it to [Render](https://render.com)
3. Add `ENCRYPTION_KEY` as an environment variable (generate locally, paste in)
4. Deploy

Render auto-deploys on every push to `main`.

> **Note:** Render's free tier has ephemeral disk — the SQLite database resets on each deploy. For persistence on Render, either use a paid plan with a persistent disk, or swap `DATABASE_URL` to a PostgreSQL connection string from Render's database addon.

---

## Deploying to Google Cloud Run

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# Set secrets
export SECRET_KEY=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# Deploy
gcloud run deploy salesagent \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "SECRET_KEY=${SECRET_KEY}" \
  --set-env-vars "ENCRYPTION_KEY=${ENCRYPTION_KEY}" \
  --set-env-vars "DATABASE_URL=sqlite:///./data/salesagent.db" \
  --memory 512Mi \
  --port 8000
```

Cloud Run scales to zero when idle (free tier). Cold start is ~2-3 seconds.

> **SQLite caveat on Cloud Run:** Cloud Run containers have ephemeral storage by default. For production persistence, mount a Cloud Filestore volume or swap to Cloud SQL (PostgreSQL). Just update `DATABASE_URL`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | Hardcoded fallback (warns loudly) | HMAC-SHA256 key for JWT signing. Generate: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | **Yes** | None (plaintext fallback, warns) | Fernet key for encrypting user credentials in DB. Generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `DATABASE_URL` | No | `sqlite:///../salesagent.db` | SQLAlchemy connection string. Prefix with `postgresql://` to use Postgres |
| `BACKEND_PORT` | No | `8000` | Port for local uvicorn. Ignored in Docker (uses `$PORT`) |
| `GEMINI_API_KEY` | No | None | Server-level fallback. Users set their own in Settings |
| `SMTP_HOST` | No | `smtp.gmail.com` | Server-level fallback SMTP host |
| `SMTP_PORT` | No | `587` | Server-level fallback SMTP port |
| `SMTP_USERNAME` | No | None | Server-level fallback Gmail address |
| `SMTP_PASSWORD` | No | None | Server-level fallback Gmail App Password |
| `SMTP_FROM_NAME` | No | None | Display name in From header for fallback account |
| `RENDER_EXTERNAL_URL` | No | None | Auto-set by Render. Added to CORS allowed origins |
| `PORT` | No | `8000` | Used by Docker CMD and health check. Set by Cloud Run/HF Spaces |

### SQLite vs PostgreSQL

The codebase is database-agnostic. The only difference is the `DATABASE_URL` and some `create_engine` kwargs:

```python
# SQLite (default)
DATABASE_URL=sqlite:///../salesagent.db
# or in Docker:
DATABASE_URL=sqlite:///./data/salesagent.db

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/salesagent
```

The engine configuration in `database.py` automatically uses `check_same_thread=False` for SQLite and connection pooling for PostgreSQL.

---

## API Reference

Full interactive docs at `http://localhost:8000/api/docs`.

All endpoints except `/api/auth/*` and `/health` require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{email, password}` | `{id, email, is_active}` |
| `POST` | `/api/auth/login` | form: `{username, password}` | `{access_token, token_type}` |

Password minimum: 8 characters (validated by Pydantic).  
Login uses OAuth2 form encoding (`application/x-www-form-urlencoded`) for compatibility with the OAuth2PasswordRequestForm dependency.

### User

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/user/me` | — | `UserResponse` |
| `GET` | `/api/user/settings` | — | Decrypted settings dict |
| `PATCH` | `/api/user/settings` | `UserSettingsUpdate` | `{status: "success"}` |

Settings PATCH validates the Gemini API key format server-side before saving: must start with `AIza` and be exactly 39 characters. Sensitive fields (`gemini_api_key`, `smtp_password`) are Fernet-encrypted before writing to the database.

### Leads

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/leads` | Query params: `status`, `skip`, `limit` (max 500) |
| `POST` | `/api/leads/upload` | Multipart file upload. Rate: 10/min/IP |
| `POST` | `/api/leads/manual` | JSON body. Rate: 20/min/IP |
| `POST` | `/api/leads/import/sheets` | `{sheet_url: str}`. Rate: 5/min/IP |
| `PATCH` | `/api/leads/{id}/status` | `{status: "new"|"contacted"|"replied"}` |
| `DELETE` | `/api/leads/{id}` | 204 No Content. Cascades to messages |

CSV upload details:
- Accepts `.csv` extension only
- Max 1MB content size (returns 413 if exceeded)
- Skips rows with missing required fields (counted in `skipped_invalid`)
- Skips exact email duplicates per user (counted in `skipped_duplicates`)
- Processes max 500 rows (silently truncates)

### Campaigns

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/campaign/generate` | Rate: 5/min/IP. Requires Gemini key |
| `POST` | `/api/campaign/{id}/send` | `{tone: "friendly"|"direct"|"curiosity"}` |
| `POST` | `/api/campaign/{id}/followup` | Sends follow-ups to all `contacted` leads |
| `GET` | `/api/campaign` | List all campaigns with stats |
| `GET` | `/api/campaign/{id}/messages` | All messages in a campaign |

Generate request body:
```json
{
  "campaign_name": "Batch 1 - Tech Founders",
  "lead_ids": [1, 2, 3, 4, 5]
}
```

Validation:
- `campaign_name`: 1-100 characters, stripped
- `lead_ids`: 1-50 items, deduplicated silently
- All lead IDs must belong to the authenticated user

### Analytics

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/analytics/summary` | TTL-cached 30s per user |
| `GET` | `/api/analytics/quota` | Current Gemini API usage stats |

Quota response:
```json
{
  "daily_used": 42,
  "daily_limit": 100,
  "daily_remaining": 58,
  "rpm_limit": 10,
  "inter_request_delay_seconds": 6.0,
  "quota_date": "2025-05-06"
}
```

---

## Database Schema

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PK |
| `email` | STRING | UNIQUE, NOT NULL, indexed |
| `hashed_password` | STRING | NOT NULL |
| `gemini_api_key` | STRING | nullable, Fernet-encrypted |
| `smtp_host` | STRING | nullable, default `smtp.gmail.com` |
| `smtp_port` | INTEGER | nullable, default `587` |
| `smtp_username` | STRING | nullable |
| `smtp_password` | STRING | nullable, Fernet-encrypted |
| `smtp_from_name` | STRING | nullable |
| `is_active` | BOOLEAN | default `True` |

### `leads`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | INTEGER | FK → users.id, indexed |
| `name` | STRING(255) | indexed |
| `role` | STRING(255) | |
| `company` | STRING(255) | |
| `email` | STRING(255) | indexed (not unique — same email can belong to different users) |
| `status` | STRING(20) | default `new`, indexed |
| `created_at` | DATETIME | server default NOW |
| `updated_at` | DATETIME | onupdate NOW, indexed |

### `campaigns`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | INTEGER | FK → users.id, indexed |
| `name` | STRING(255) | NOT NULL |
| `created_at` | DATETIME | server default NOW |

### `messages`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PK |
| `lead_id` | INTEGER | FK → leads.id |
| `campaign_id` | INTEGER | FK → campaigns.id |
| `tone` | STRING(20) | `friendly`, `direct`, or `curiosity` |
| `message_type` | STRING(20) | `initial` or `followup` |
| `subject` | TEXT | |
| `body` | TEXT | |
| `sent` | BOOLEAN | default `False` |
| `sent_at` | DATETIME | nullable |
| `is_selected` | BOOLEAN | default `False` (True = chosen tone sent) |
| `created_at` | DATETIME | server default NOW |

**Composite indexes on messages:**
- `ix_messages_campaign_sent` on `(campaign_id, sent, message_type)` — used by send and follow-up queries
- `ix_messages_lead_campaign` on `(lead_id, campaign_id)` — used by deduplication check

---

## Security Architecture

### Credential Encryption

User-submitted API keys and SMTP passwords are encrypted using **Fernet** (AES-128-CBC with HMAC-SHA256) before being written to the database.

```
User submits Gemini key in Settings
        │
        ▼
PATCH /api/user/settings
        │
        ▼
Format validation (starts with AIza, 39 chars)
        │
        ▼
encrypt(key) → Fernet.encrypt(key.encode()).decode()
        │
        ▼
Database: stores ciphertext — never plaintext
        │
        ▼ (at generation time, in memory only)
decrypt(stored_ciphertext) → plaintext key
        │
        ▼
genai.Client(api_key=key) — used, then garbage collected
```

If `ENCRYPTION_KEY` is not set, the system falls back to plaintext with a warning log. This is intentional for local development — you get a working system without mandatory key generation. Never run without `ENCRYPTION_KEY` in production.

The `decrypt()` function handles the migration case gracefully: if a value was stored before encryption was enabled, decryption will fail and the original value is returned as-is.

### JWT Authentication

- Algorithm: HS256
- Expiry: 24 hours
- Signing key: `SECRET_KEY` from environment
- Token stored in `localStorage` on the client (acknowledged XSS risk — acceptable for self-hosted single-user instances; use httpOnly cookies for multi-tenant production)
- Auto-logout on 401: `api.js` catches any 401 response outside `/api/auth/` and redirects to `/login`

### Password Hashing

bcrypt with random salt per user via `passlib`:

```python
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
```

### Security Headers

Every response gets these headers via `SecurityHeadersMiddleware`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store
```

### Data Isolation

Every database query is scoped to `user_id == current_user.id`. There is no admin role, no cross-user data access, no shared state between users except the server-level Gemini rate limiter.

---

## Rate Limiting

Two independent layers:

### HTTP Layer (slowapi)

Per IP address, applied to write endpoints:

| Endpoint | Limit |
|---|---|
| `POST /api/leads/upload` | 10/minute |
| `POST /api/leads/manual` | 20/minute |
| `POST /api/campaign/generate` | 5/minute |
| `POST /api/leads/import/sheets` | 5/minute |

Exceeding the limit returns `429 Too Many Requests`.

### Gemini API Layer (custom token bucket)

A singleton `_RateLimiter` instance enforces conservative limits below Google's free tier caps:

```python
MAX_RPM: int = 10           # Google allows 15 — 33% headroom
MAX_RPD: int = 100          # Google allows 1,500 — very conservative
INTER_REQUEST_DELAY: float = 6.0  # 60s / 10 = guaranteed ≤10 RPM
```

Implementation:

```python
def acquire(self) -> None:
    with self._lock:
        self._reset_if_new_day()
        if self._daily_count >= MAX_RPD:
            raise QuotaExceededError(...)
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < INTER_REQUEST_DELAY:
            time.sleep(INTER_REQUEST_DELAY - elapsed)
        self._last_request_time = time.monotonic()
        self._daily_count += 1
```

Thread-safe via `threading.Lock()`. The daily counter resets automatically at midnight by comparing `date.today()` to the stored `quota_date`.

**Tuning for paid plans:** Edit `MAX_RPD` in `backend/services/rate_limiter.py`. The `INTER_REQUEST_DELAY` can be reduced proportionally if you have a higher RPM quota.

---

## Google Sheets Import

No OAuth. No service account. No gspread dependency.

SalesAgent uses Google's public CSV export endpoint:

```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv
```

The spreadsheet ID is extracted from any valid Google Sheets URL format using:

```python
SHEET_ID_PATTERN = re.compile(r"/spreadsheets/d/([a-zA-Z0-9_-]+)")
```

This handles all URL variants:
- `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- `https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0`
- `https://docs.google.com/spreadsheets/d/SHEET_ID/pub`

**Requirements:**
- Sheet must be shared as "Anyone with the link — Viewer"
- Must have columns: `name`, `role`, `company`, `email` (case-insensitive, any order)
- Max 500 rows processed

**Error handling:**
- 404 → "Sheet not found" (clear message)
- HTML response body → sheet is private (not public)
- Non-200 → HTTP status code in error message
- Network error → connection error with exception message

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests use an in-memory SQLite database and override FastAPI dependencies:

```python
# conftest.py
app.dependency_overrides[get_db] = override_get_db        # in-memory DB
app.dependency_overrides[get_current_user] = lambda: test_user  # skip JWT
```

The `client_no_auth` fixture does not override `get_current_user` — used for testing actual auth flows (register, login, 401s).

### Test Coverage

| File | Tests | What's Covered |
|---|---|---|
| `test_auth.py` | 4 | Register, duplicate email, wrong password, unauthenticated access |
| `test_leads.py` | 5 | Valid CSV, duplicate email, wrong file type, oversized file, invalid email |
| `test_campaign.py` | 2 | Missing Gemini key gate, invalid lead IDs |
| `test_analytics.py` | 2 | Zero-state correctness, response key structure |
| `test_rate_limiter.py` | 2 | Daily quota enforcement, status structure |
| `test_sheets_import.py` | 2 | Invalid URL rejection, empty URL handling |

No real API calls are made in tests. The rate limiter tests mock `MAX_RPD` and `INTER_REQUEST_DELAY` at module level and restore them in `finally` blocks.

### CI/CD

GitHub Actions runs the full test suite on every push and pull request:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: cd backend && pytest tests/ -v
  env:
    SECRET_KEY: "ci-test-secret-key-32-characters-min!!"
    GEMINI_API_KEY: "test-key-placeholder"
    SMTP_HOST: "smtp.gmail.com"
    SMTP_PORT: "587"
```

---

## Project Structure

```
salesagent/
│
├── .github/
│   └── workflows/
│       └── test.yml                  # CI pipeline
│
├── backend/
│   ├── middleware/
│   │   └── security.py               # SecurityHeadersMiddleware
│   │
│   ├── models/
│   │   ├── user.py                   # User ORM model
│   │   ├── lead.py                   # Lead ORM model
│   │   └── campaign.py               # Campaign + Message ORM models, composite indexes
│   │
│   ├── routes/
│   │   ├── auth.py                   # Register + login
│   │   ├── user.py                   # /me + /settings
│   │   ├── leads.py                  # CRUD + CSV + manual + Sheets
│   │   ├── campaign.py               # Generate + send + followup + list
│   │   └── analytics.py              # Summary + quota
│   │
│   ├── schemas/
│   │   ├── gemini_output.py          # Pydantic schemas for structured output
│   │   ├── user.py                   # UserCreate, UserResponse, Token, Settings
│   │   ├── lead.py                   # LeadCreate, LeadResponse, LeadStatusUpdate
│   │   └── campaign.py               # GenerateRequest, SendCampaignRequest
│   │
│   ├── services/
│   │   ├── ai_service.py             # Gemini calls, structured output, fallback
│   │   ├── enrichment_service.py     # Google Search grounding for company research
│   │   ├── email_service.py          # SMTP via user credentials
│   │   ├── sheets_service.py         # Google Sheets CSV export parsing
│   │   ├── analytics_service.py      # Aggregated SQL queries with TTL cache
│   │   ├── rate_limiter.py           # Thread-safe token bucket + daily counter
│   │   └── tracking_service.py       # Follow-up tone rotation (6 lines)
│   │
│   ├── tests/
│   │   ├── conftest.py               # In-memory DB, fixtures, dependency overrides
│   │   ├── test_auth.py
│   │   ├── test_leads.py
│   │   ├── test_campaign.py
│   │   ├── test_analytics.py
│   │   ├── test_rate_limiter.py
│   │   └── test_sheets_import.py
│   │
│   ├── utils/
│   │   ├── cache.py                  # TTL cache decorator
│   │   ├── encryption.py             # Fernet encrypt/decrypt with graceful fallback
│   │   ├── limiter.py                # slowapi Limiter singleton
│   │   ├── prompts.py                # Gemini prompt builders
│   │   └── security.py               # JWT creation/verification, bcrypt
│   │
│   ├── config.py                     # Pydantic Settings (env var loading)
│   ├── database.py                   # SQLAlchemy engine + session factory
│   ├── main.py                       # FastAPI app, middleware, routes, SPA serving
│   ├── pytest.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js                # All fetch calls, 401 auto-logout
│   │   ├── components/
│   │   │   ├── CampaignPreview.jsx   # Generated messages + send panel
│   │   │   ├── CampaignSent.jsx      # Post-send state with followup button
│   │   │   ├── CampaignSetup.jsx     # Lead selection + campaign naming
│   │   │   ├── EmptyState.jsx        # Reusable empty state
│   │   │   ├── EnrichmentCard.jsx    # AI company research display
│   │   │   ├── LeadTable.jsx         # ARIA-labelled action buttons
│   │   │   ├── MessagePreview.jsx    # ARIA tab pattern for tone variants
│   │   │   ├── PageHeader.jsx        # Title + description + action slot
│   │   │   ├── Sidebar.jsx           # Fixed navigation, email display, logout
│   │   │   └── StatsCard.jsx         # Analytics metric card
│   │   ├── pages/
│   │   │   ├── CampaignPage.jsx      # State machine: setup→generating→preview→sending→sent
│   │   │   ├── Dashboard.jsx         # Analytics + campaign table + lead tracker
│   │   │   ├── Login.jsx             # Register/login form with aria-live errors
│   │   │   ├── Onboarding.jsx        # 3-step wizard for first-time setup
│   │   │   ├── Settings.jsx          # Gemini + SMTP configuration
│   │   │   └── UploadPage.jsx        # CSV + Sheets + manual tabs
│   │   ├── App.jsx                   # Router + AuthProvider + onboarding gate
│   │   ├── AuthContext.jsx           # JWT state management
│   │   └── main.jsx                  # ReactDOM.createRoot entry point
│   ├── index.html                    # CSS variables, fonts, animation classes
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile                        # Multi-stage: Node 20 → Python 3.12
├── docker-compose.yml                # Single service + named volume
├── render.yaml                       # Render deployment configuration
├── .env.example
└── .github/workflows/test.yml
```

---

## Configuration & Tuning

### Increasing Gemini Quota

If you upgrade to a paid Gemini plan or verify you have higher limits, edit `backend/services/rate_limiter.py`:

```python
MAX_RPM: int = 15             # Google's actual free tier limit
MAX_RPD: int = 1500           # Google's actual free tier limit
INTER_REQUEST_DELAY: float = 4.0  # 60s / 15rpm = 4s minimum
```

### Switching to PostgreSQL

```env
DATABASE_URL=postgresql://user:password@localhost:5432/salesagent
```

The engine automatically uses connection pooling for non-SQLite URLs:
- `pool_size=2` (persistent connections)
- `max_overflow=3` (burst capacity)
- `pool_timeout=30s`
- `pool_recycle=1800s` (30-minute connection refresh)

### Changing the Gemini Model

Update `MODEL` in both:
- `backend/services/ai_service.py`
- `backend/services/enrichment_service.py`

```python
MODEL = "gemini-2.5-pro"  # Slower but higher quality
MODEL = "gemini-1.5-flash" # Faster, lower cost
```

### Adjusting Campaign Batch Size

```python
# backend/schemas/campaign.py
if len(v) > 50:   # Change this
    raise ValueError("Maximum 50 leads per generation batch")
```

### Tuning the Analytics Cache

```python
# backend/services/analytics_service.py
@ttl_cache(ttl_seconds=30)  # Increase for heavy traffic
def get_analytics_data(user_id: int, db: Session) -> dict:
```

### Adding New Email Tones

1. Add the tone to `tracking_service.py`'s rotation mapping
2. Update the `SendCampaignRequest` validator in `schemas/campaign.py`
3. Update the Pydantic schema in `schemas/gemini_output.py`
4. Update the generation prompt in `utils/prompts.py`
5. Update the tone selector in `CampaignPreview.jsx`

### Database Migrations

The app uses `Base.metadata.create_all()` on startup — safe for adding new tables, but not for modifying existing columns. For schema changes in production:

```bash
pip install alembic
cd backend
alembic init alembic
alembic revision --autogenerate -m "add new column"
alembic upgrade head
```

---

## Known Limitations & Roadmap

### Current Limitations

| Limitation | Details | Workaround |
|---|---|---|
| In-memory rate limiter | Resets on process restart | Rate is conservative enough that a restart doesn't cause Google API bans |
| Manual reply marking | No inbox polling | Use the Dashboard "Mark Replied" button when a lead responds |
| SQLite single-writer | No horizontal scaling | Swap to PostgreSQL for multi-instance deployments |
| Plain text emails | No HTML/rich formatting | Clean plain text actually has better deliverability in cold outreach |
| Single follow-up per lead | One follow-up per campaign | Most cold outreach sequences are 2-3 touches — sufficient for the use case |
| Public Sheets only | Private sheets require OAuth | Share the sheet before importing |
| `localStorage` JWT | XSS accessible | Acceptable for self-hosted. Swap to httpOnly cookies for public multi-tenant deployments |
| In-memory analytics cache | Shared across requests | Not a problem for single-user instances |

### Potential Improvements

- **OAuth2 Google login** — skip manual credential entry
- **Inbox polling via Gmail API** — automatic reply detection instead of manual marking
- **HTML email templates** — branded emails with proper formatting
- **Webhook for reply tracking** — real-time status updates
- **Multi-tone A/B testing** — send different tones to random subsets and measure
- **Campaign scheduling** — send at optimal times per timezone
- **Lead scoring** — rank leads by enrichment data before campaign creation
- **PostgreSQL + Alembic** — production-grade migrations
- **Multi-tenancy** — organization accounts with team members
- **Unsubscribe handling** — one-click unsubscribe link tracking

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests for new functionality
4. Ensure tests pass: `cd backend && pytest tests/ -v`
5. Open a pull request with a clear description of what changes and why

### Development Guidelines

- All database queries must be scoped to `user_id == current_user.id`
- All write endpoints should have `@limiter.limit("X/minute")`
- New Gemini calls should go through `gemini_limiter.acquire()`
- Sensitive fields (API keys, passwords) must be Fernet-encrypted before DB write
- New routes should have at least one test in `tests/`

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with way too much caffeine and a genuine hatred of generic cold emails.

</div>
