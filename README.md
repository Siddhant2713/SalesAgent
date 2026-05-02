<div align="center">

# SalesAgent

### AI-Powered Cold Outreach Platform

**Gemini researches your leads. Writes hyper-personalized emails. Sends them. Learns what works.**

Built for [PromptWars](https://promptwars.in) — Google × Scaler School of Technology

---

[![Tests](https://github.com/YOUR_USERNAME/salesagent/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/salesagent/actions)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4.svg)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## What SalesAgent Does

SalesAgent is not another email template tool. It is an AI agent pipeline powered by the Google ecosystem:

1. **Import leads** from a Google Sheets URL or CSV — your sales team doesn't change their workflow
2. **Gemini researches each company** using Google Search grounding — it finds the company's stage, pain points, and the best outreach angle before writing a single word
3. **Generates 3 personalized email variants** (friendly, direct, curiosity) using Gemini's structured output API — guaranteed valid JSON, no parsing failures
4. **Shows you the AI's reasoning** — an enrichment card displays what Gemini found about each company and why it chose that approach
5. **Sends via Gmail SMTP** with per-user credentials stored using Fernet encryption
6. **Tracks replies** and auto-generates follow-ups in a different tone when leads don't respond
7. **Learns over time** — the analytics dashboard shows which tone performs best for your specific leads

### The AI Pipeline (What Makes This Different)

```
Lead Added
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 1: Company Enrichment              │
│  Gemini + Google Search Grounding        │
│                                          │
│  Input:  "Notion, Head of Growth"        │
│  Output: {                               │
│    company_stage: "growth_stage",        │
│    pain_points: ["retention", "onboard"] │
│    best_hook: "Notion's viral loop...",  │
│    tone: "curiosity"                     │
│  }                                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 2: Email Generation                │
│  Gemini structured output (response_schema)│
│                                          │
│  Input:  Lead + Enrichment Context       │
│  Output: {                               │
│    friendly:  { subject, body },         │
│    direct:    { subject, body },         │
│    curiosity: { subject, body }          │
│  }                                       │
│  Guaranteed valid JSON — no regex needed │
└─────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                  │
│  Vite · React Router · Tailwind CSS · JWT auth          │
│                                                          │
│  Pages: Upload · Campaigns · Dashboard · Settings       │
│  Components: EnrichmentCard · MessagePreview · LeadTable│
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/JSON + Bearer Token
┌───────────────────────▼─────────────────────────────────┐
│                   Backend (FastAPI)                      │
│  Python 3.12 · SQLAlchemy 2 · Pydantic v2               │
│                                                          │
│  Routes:  /api/auth  /api/leads  /api/campaign          │
│           /api/analytics  /api/user                     │
│  Middleware: JWT auth · slowapi rate limiting           │
│             security headers · CORS                     │
└──────┬────────────────┬──────────────────┬──────────────┘
       │                │                  │
┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
│   SQLite    │  │ Gemini API  │  │  Gmail SMTP  │
│  (SQLAlchemy│  │ 2.5 Flash   │  │  (per-user   │
│   ORM)      │  │ + Search    │  │   creds,     │
│             │  │   grounding │  │   encrypted) │
│  Encrypted: │  │             │  │              │
│  API keys   │  │ Enrichment  │  │  starttls    │
│  SMTP pass  │  │ Generation  │  │  auth        │
└─────────────┘  └─────────────┘  └──────────────┘
```

---

## Google Ecosystem Integration

| Service | How It's Used |
|---|---|
| **Gemini 2.5 Flash** | Generates all email variants and follow-ups |
| **Google Search Grounding** | Researches each company before writing emails — Gemini calls the web live |
| **Gemini Structured Output** | `response_schema` enforces exact JSON format — eliminates parsing failures |
| **Google Sheets API** | Direct lead import from any public Google Sheet — no CSV needed |
| **Gmail (SMTP)** | Email delivery using per-user Gmail app passwords |
| **Google AI Studio** | Where users get their Gemini API keys |

---

## Feature Highlights

### For Users

- **3-Panel Lead Import** — CSV upload, Google Sheets URL paste, or manual entry
- **AI Company Research Card** — See what Gemini found about each company before it wrote the email
- **3-Tone Email Previews** — Switch between Friendly / Direct / Curiosity variants with tabbed UI
- **One-Click Campaign Send** — Select a tone and send to all leads in one action
- **Automatic Follow-ups** — System switches tone automatically (friendly → curiosity → direct) to non-responders
- **Reply Tracking Dashboard** — Analytics show reply rates by tone, helping you learn what works
- **Per-User Settings** — Every user brings their own Gemini key and Gmail credentials

### For Judges / Technical Reviewers

- **Gemini structured output** with Pydantic schema validation — not just "return JSON please"
- **Google Search grounding** in enrichment pipeline — Gemini actively searches the web per lead
- **Fernet AES-128 encryption** for all user credentials at rest
- **JWT authentication** with bcrypt password hashing — full multi-user system
- **15+ pytest tests** covering auth, leads, campaign gates, analytics, rate limiting, and Sheets import
- **GitHub Actions CI** running the full test suite on every push
- **Multi-stage Dockerfile** with production Gunicorn/UvicornWorker server
- **docker-compose** with persistent SQLite volume and health checks
- **Composite DB indexes** on hot query paths
- **ARIA tabs, live regions, skip nav, focus management** — accessibility-first UI

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11+ | 3.12 recommended |
| Node.js | 18+ | For frontend build |
| Gmail Account | Any | With 2-Step Verification enabled |
| Gemini API Key | Free tier | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| OpenSSL | Any | For generating SECRET_KEY |

---

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/YOUR_USERNAME/salesagent.git
cd salesagent

# Copy and fill in your credentials
cp .env.example .env
```

### 2. Generate Required Keys

```bash
# SECRET_KEY — signs JWT tokens. Required.
openssl rand -hex 32

# ENCRYPTION_KEY — encrypts credentials in the database. Required.
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste both values into your `.env` file.

### 3. Fill in `.env`

```env
# ── AI ──────────────────────────────────────────────────────────
GEMINI_API_KEY=AIzaSy...          # Optional — users can set their own in the app

# ── Email ────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=youremail@gmail.com  # Optional — users configure their own
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail App Password (not your real password)
SMTP_FROM_NAME=Your Name

# ── Database ─────────────────────────────────────────────────────
DATABASE_URL=sqlite:///../salesagent.db

# ── Security (REQUIRED) ──────────────────────────────────────────
SECRET_KEY=<output of openssl rand -hex 32>
ENCRYPTION_KEY=<output of Fernet.generate_key()>
```

### 4. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
Swagger docs at `http://localhost:8000/api/docs`

### 5. Start the Frontend

```bash
# In a new terminal, from project root
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 6. Create Your Account

Open `http://localhost:5173`, register an account, then go to **Settings** to add your:
- Gemini API Key (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- Gmail address and App Password

---

## Docker (Production)

Run the complete production stack with a single command:

```bash
# Set your required environment variables first
export SECRET_KEY=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

docker-compose up --build
```

This builds:
- **Stage 1**: Vite production build of the React frontend
- **Stage 2**: Python 3.12 with Gunicorn + UvicornWorker serving the FastAPI app + static files

The app is available at `http://localhost:8000`.

### Deploy to Google Cloud Run

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# Deploy
gcloud run deploy salesagent \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "SECRET_KEY=$(openssl rand -hex 32)" \
  --set-env-vars "ENCRYPTION_KEY=$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" \
  --set-env-vars "DATABASE_URL=sqlite:///./data/salesagent.db" \
  --memory 512Mi \
  --port 8000
```

---

## How to Use

### Step 1: Import Leads

Go to the **Upload Leads** page. You have three options:

**Google Sheets (recommended)**
1. Open your leads spreadsheet in Google Sheets
2. Make sure it has columns: `name`, `role`, `company`, `email` (case-insensitive)
3. Share it: File → Share → "Anyone with the link" → Viewer
4. Paste the URL in the Google Sheets panel and click Import

**CSV Upload**
Upload any `.csv` file under 1MB with the same four headers. Duplicates are automatically skipped.

**Manual Entry**
Add individual leads one at a time using the form.

---

### Step 2: Create a Campaign

Go to **Campaigns**, name your campaign, and select which leads to include (max 50 per batch).

Click **Generate Messages**. For each lead, SalesAgent will:

1. Use Gemini + Google Search grounding to research the company
2. Determine the company stage, key pain points, and best outreach hook
3. Generate 3 personalized email variants (friendly, direct, curiosity)

You'll see an **AI Company Research** card above each email showing what Gemini found. Each email is personalized based on that research.

---

### Step 3: Preview and Send

Review the three email variants for each lead. Use the tone tabs to switch between them.

Select a tone and click **Send Campaign**. All emails are sent via your configured Gmail account.

---

### Step 4: Track and Follow Up

On the **Dashboard**:
- Mark leads as "Replied" when they respond to your email
- Click **Send Followups** to automatically send a follow-up email (in a different tone) to all leads who haven't replied

The system automatically picks the follow-up tone:
- Friendly → Curiosity
- Direct → Friendly  
- Curiosity → Direct

---

### Step 5: Analyze Performance

The Dashboard shows:
- Total leads, emails sent, replies, and reply rate
- Per-tone breakdown: which tone is getting the most replies
- Best performing tone recommendation

---

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and paste it in **Settings** inside SalesAgent

**Free tier limits:**
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)

SalesAgent enforces a conservative cap of 10 RPM / 100 RPD with a 6-second inter-request delay to stay safely within limits. Note: each lead uses **2 API calls** — 1 for company research and 1 for email generation. A campaign of 20 leads will take about 2 minutes.

---

## Getting Your Gmail App Password

Gmail requires an App Password (not your real password) for SMTP access.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Make sure **2-Step Verification** is enabled
3. Search for **App Passwords**
4. Create a new app password (name it "SalesAgent" for easy identification)
5. Copy the 16-character code — this is your `smtp_password` in Settings

> **Important:** Never use your regular Gmail password. App Passwords are separate credentials that can be revoked at any time.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

The test suite covers:

| File | What It Tests |
|---|---|
| `test_auth.py` | Register, duplicate email, wrong password, unauthenticated access |
| `test_leads.py` | CSV upload, duplicates, wrong file type, oversized file, invalid email |
| `test_campaign.py` | Missing Gemini key gate, invalid lead IDs |
| `test_analytics.py` | Zero state, response structure, all tone keys present |
| `test_rate_limiter.py` | Daily quota enforcement, status structure |
| `test_sheets_import.py` | Invalid URL rejection, empty URL handling |

Tests use an in-memory SQLite database and dependency injection to mock authentication, so no real API calls are made.

---

## Project Structure

```
salesagent/
├── .github/
│   └── workflows/
│       └── test.yml              # CI — runs tests on every push
├── backend/
│   ├── middleware/
│   │   └── security.py           # X-Frame-Options, nosniff, CSP headers
│   ├── models/
│   │   ├── user.py               # User model with encrypted credential fields
│   │   ├── lead.py               # Lead model with user_id isolation
│   │   └── campaign.py           # Campaign + Message models with composite indexes
│   ├── routes/
│   │   ├── auth.py               # /api/auth/register + /api/auth/login
│   │   ├── user.py               # /api/user/me + /api/user/settings
│   │   ├── leads.py              # CRUD + /api/leads/import/sheets
│   │   ├── campaign.py           # Generate + Send + Followup + Get
│   │   └── analytics.py          # Summary + Quota
│   ├── schemas/
│   │   ├── gemini_output.py      # Pydantic schemas for Gemini structured output
│   │   ├── user.py               # UserCreate (with password validation)
│   │   ├── lead.py               # LeadCreate, LeadResponse
│   │   └── campaign.py           # GenerateRequest, SendCampaignRequest
│   ├── services/
│   │   ├── ai_service.py         # Gemini calls with structured output + fallback
│   │   ├── enrichment_service.py # Google Search grounding for company research
│   │   ├── email_service.py      # SMTP email sending with decrypted credentials
│   │   ├── sheets_service.py     # Google Sheets CSV export import
│   │   ├── analytics_service.py  # Aggregated SQL queries with TTL cache
│   │   ├── rate_limiter.py       # Thread-safe token bucket (10 RPM / 100 RPD)
│   │   └── tracking_service.py   # Follow-up tone rotation logic
│   ├── tests/
│   │   ├── conftest.py           # Test DB, fixtures, dependency overrides
│   │   ├── test_auth.py
│   │   ├── test_leads.py
│   │   ├── test_campaign.py
│   │   ├── test_analytics.py
│   │   ├── test_rate_limiter.py
│   │   └── test_sheets_import.py
│   ├── utils/
│   │   ├── cache.py              # TTL cache decorator for analytics
│   │   ├── encryption.py         # Fernet AES-128 for credential storage
│   │   ├── limiter.py            # slowapi instance
│   │   ├── prompts.py            # Gemini prompt builders with context injection
│   │   └── security.py           # JWT creation/verification, bcrypt hashing
│   ├── config.py                 # Pydantic settings (SECRET_KEY required)
│   ├── database.py               # SQLAlchemy engine + session factory
│   ├── main.py                   # FastAPI app, middleware, routes
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js            # All API calls with 401 auto-logout
│   │   ├── components/
│   │   │   ├── EnrichmentCard.jsx  # AI company research display
│   │   │   ├── MessagePreview.jsx  # ARIA tab pattern email previews
│   │   │   ├── LeadTable.jsx       # aria-label on all action buttons
│   │   │   ├── CampaignSetup.jsx
│   │   │   ├── CampaignPreview.jsx
│   │   │   ├── CampaignSent.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Visible labels, aria-live on errors
│   │   │   ├── UploadPage.jsx      # 3-panel: CSV + Sheets + Manual
│   │   │   ├── CampaignPage.jsx    # State machine with focus management
│   │   │   ├── Dashboard.jsx       # Analytics + campaign table + lead tracker
│   │   │   └── Settings.jsx        # Per-user Gemini + SMTP configuration
│   │   ├── App.jsx                 # BrowserRouter → AuthProvider → Routes
│   │   └── AuthContext.jsx         # JWT token management
│   └── index.html                  # lang="en", skip nav ready
├── Dockerfile                      # Multi-stage: Node build → Python serve
├── docker-compose.yml
├── .env.example
└── .github/workflows/test.yml
```

---

## API Reference

Full interactive documentation available at `http://localhost:8000/api/docs` (Swagger UI).

### Authentication

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/api/auth/register` | POST | `{email, password}` | `UserResponse` |
| `/api/auth/login` | POST | form: `{username, password}` | `{access_token, token_type}` |

All other endpoints require `Authorization: Bearer <token>`.

### Leads

| Endpoint | Method | Description |
|---|---|---|
| `/api/leads` | GET | List leads (filterable by status) |
| `/api/leads/upload` | POST | Upload CSV file |
| `/api/leads/manual` | POST | Add single lead |
| `/api/leads/import/sheets` | POST | Import from Google Sheets URL |
| `/api/leads/{id}/status` | PATCH | Update lead status |
| `/api/leads/{id}` | DELETE | Delete lead and messages |

### Campaigns

| Endpoint | Method | Description |
|---|---|---|
| `/api/campaign` | GET | List all campaigns with stats |
| `/api/campaign/generate` | POST | Generate emails for leads (5/min rate limit) |
| `/api/campaign/{id}/send` | POST | Send a tone's emails |
| `/api/campaign/{id}/followup` | POST | Send follow-ups to unreplied leads |
| `/api/campaign/{id}/messages` | GET | All messages in a campaign |

### Analytics & User

| Endpoint | Method | Description |
|---|---|---|
| `/api/analytics/summary` | GET | Reply rates, tone stats, best tone |
| `/api/analytics/quota` | GET | Current Gemini API usage |
| `/api/user/me` | GET | Current user info |
| `/api/user/settings` | GET / PATCH | Get or update API keys and SMTP config |

---

## Security Architecture

### Credential Storage

User-submitted API keys and SMTP passwords are encrypted using Fernet (AES-128-CBC + HMAC-SHA256) before being written to the database. The `ENCRYPTION_KEY` environment variable holds the Fernet key and never touches the database.

```
User enters Gemini API key
        │
        ▼
┌─────────────────┐
│  PATCH /settings│ ← Validates key format (starts with AIza, 39 chars)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ encrypt(key)    │ ← Fernet.encrypt(key.encode())
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database (DB)  │ ← Stores ciphertext — never plaintext
└─────────────────┘
         │
         ▼ (at generation time)
┌─────────────────┐
│ decrypt(key)    │ ← Only happens in memory, never logged
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ genai.Client()  │ ← API key used, then discarded
└─────────────────┘
```

### Rate Limiting

Two layers of rate limiting are applied:

1. **HTTP level** (`slowapi`): Per-IP limits on write endpoints
   - CSV upload: 10 requests/minute
   - Manual lead add: 20 requests/minute
   - Campaign generate: 5 requests/minute
   - Sheets import: 5 requests/minute

2. **Gemini API level** (custom `_RateLimiter`): Singleton rate limiter
   - 10 requests per minute (enforced with 6-second inter-request delay)
   - 100 requests per day (conservative vs. Google's 1,500 limit)
   - Thread-safe with `threading.Lock()`

### Other Security Measures

- JWT tokens signed with `HS256` using a required `SECRET_KEY` (no default, fails loudly)
- bcrypt password hashing with random salt per user
- Security headers on every response: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Cache-Control: no-store`
- CORS locked to `http://localhost:5173` with explicit methods and headers
- All database queries scoped to `user_id` — users cannot access each other's data
- Input validation via Pydantic on all endpoints
- Email format validation via `EmailStr`
- Gemini API key format validation on settings save

---

## Configuration Reference

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ Yes | JWT signing key. Generate: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | ✅ Yes | Fernet key for credential encryption. See below. |
| `GEMINI_API_KEY` | Optional | Server-level fallback. Users can set their own in the app. |
| `SMTP_HOST` | Optional | Default: `smtp.gmail.com` |
| `SMTP_PORT` | Optional | Default: `587` |
| `SMTP_USERNAME` | Optional | Server-level fallback Gmail address |
| `SMTP_PASSWORD` | Optional | Server-level fallback Gmail App Password |
| `SMTP_FROM_NAME` | Optional | Display name in sent emails |
| `DATABASE_URL` | Optional | Default: `sqlite:///../salesagent.db` |
| `BACKEND_PORT` | Optional | Default: `8000` |

Generate `ENCRYPTION_KEY`:
```python
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Gemini API Features Used

SalesAgent uses three distinct Gemini capabilities, each serving a specific purpose:

### 1. Google Search Grounding
Used in `enrichment_service.py` to research companies before writing emails.

```python
config = types.GenerateContentConfig(
    temperature=0.4,
    tools=[types.Tool(google_search=types.GoogleSearch())],
)
```

Gemini actively searches the web for each company and returns structured analysis including their stage, pain points, and the best outreach hook.

### 2. Structured Output (response_schema)
Used in `ai_service.py` to guarantee the shape of generated emails.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_schema=InitialEmailSet,  # Pydantic model
        response_mime_type="application/json",
    )
)
```

This eliminates parse failures entirely — Gemini is contractually bound to return `{friendly: {subject, body}, direct: {...}, curiosity: {...}}`.

### 3. Context-Injected Generation
The enrichment output from Step 1 is injected into the generation prompt for Step 2, creating a two-stage reasoning pipeline: research → write.

---

## Google Sheets Import

SalesAgent imports leads from any publicly shared Google Sheets spreadsheet with zero OAuth setup required. It uses Google's CSV export endpoint:

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv
```

**Required sheet columns** (case-insensitive, any order):
- `name` — Lead's full name
- `role` — Job title or role
- `company` — Company name
- `email` — Email address

**To make your sheet public:**
In Google Sheets: File → Share → Share with others → Change to "Anyone with the link" → Viewer → Done

---

## Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| In-memory rate limiter | Resets on server restart | Restart won't cause Google API bans; limit is conservative |
| Manual reply marking | Requires human check | Mark "Replied" on the Dashboard when leads respond |
| SQLite storage | Not suitable for horizontal scaling | Swap `DATABASE_URL` for PostgreSQL for production |
| Plain text emails | No HTML formatting | Emails are clean and professional without HTML |
| Single follow-up per lead | One follow-up only | Works for most cold outreach sequences |
| Public Sheets only | Can't import private sheets | Share the sheet first |
| localStorage JWT storage | XSS vulnerability | Acceptable for single-user competition context; production should use httpOnly cookies |

---

## Development Notes

### Adding a New API Endpoint

1. Add a route function in the appropriate `routes/` file
2. Add a Pydantic schema in `schemas/` if needed
3. Add `current_user: User = Depends(get_current_user)` for auth
4. Filter all queries by `user_id == current_user.id`
5. Add `@limiter.limit("X/minute")` for write operations
6. Add a test in `tests/`

### Changing Gemini Model

Update `MODEL` in `backend/services/ai_service.py` and `backend/services/enrichment_service.py`:

```python
MODEL = "gemini-2.5-pro"  # or any other supported model
```

### Adjusting Rate Limits

Edit `backend/services/rate_limiter.py`:

```python
MAX_RPM: int = 10    # Increase if you have a paid API plan
MAX_RPD: int = 100   # Google allows 1,500 on free tier
```

### Database Migrations

SalesAgent uses `Base.metadata.create_all()` for auto-migration on startup. For schema changes in production, use Alembic:

```bash
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "add new column"
alembic upgrade head
```

---

## Built With

### Backend
- [FastAPI](https://fastapi.tiangolo.com) — async Python web framework
- [SQLAlchemy 2](https://docs.sqlalchemy.org) — ORM with relationship loading
- [Pydantic v2](https://docs.pydantic.dev) — data validation and serialization
- [python-jose](https://python-jose.readthedocs.io) — JWT encoding/decoding
- [bcrypt](https://pypi.org/project/bcrypt/) — password hashing
- [cryptography (Fernet)](https://cryptography.io) — symmetric encryption for credentials
- [slowapi](https://github.com/laurentS/slowapi) — rate limiting for FastAPI
- [google-genai](https://ai.google.dev/gemini-api/docs) — official Gemini Python SDK
- [httpx](https://www.python-httpx.org) — async HTTP client for Sheets import
- [pytest](https://pytest.org) — test framework

### Frontend
- [React 18](https://react.dev) — UI framework
- [Vite 5](https://vitejs.dev) — build tool and dev server
- [React Router 6](https://reactrouter.com) — client-side routing
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS

### Infrastructure
- [Gunicorn](https://gunicorn.org) + [Uvicorn](https://www.uvicorn.org) — production ASGI server
- [Docker](https://docker.com) — multi-stage containerization
- [GitHub Actions](https://github.com/features/actions) — CI/CD

---

## Contributing

This project was built for PromptWars. PRs welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests for new functionality
4. Run the test suite: `cd backend && pytest tests/ -v`
5. Submit a PR with a clear description

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ☕ and too many Gemini API calls

**PromptWars 2025 — Google × Scaler School of Technology**

</div>