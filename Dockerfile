# ─────────────────────────────────────────────────────────────────────────────
# SalesAgent — Multi-stage Production Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the React frontend
# Stage 2: Serve FastAPI + static frontend with gunicorn
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Frontend Build ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent

COPY frontend/ ./

# Build production assets (empty base URL = same-origin API calls)
ENV VITE_API_BASE_URL=""
RUN npm run build

# ── Stage 2: Backend + Serve ─────────────────────────────────────────────────
FROM python:3.12-slim AS production

# System deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn==22.0.0

# Copy backend code
COPY backend/ ./

# Copy built frontend into backend static dir
COPY --from=frontend-build /app/frontend/dist ./static

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV DATABASE_URL="sqlite:///./data/salesagent.db"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose port — Cloud Run uses 8000 (passed via --port), HF Spaces overrides via $PORT
ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import os; import urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\",7860)}/health')"

# Run with gunicorn — uses $PORT for platform compatibility
# --preload loads the app once before forking workers (prevents SQLite race condition)
CMD gunicorn main:app \
     --worker-class uvicorn.workers.UvicornWorker \
     --bind 0.0.0.0:$PORT \
     --workers 2 \
     --timeout 120 \
     --preload \
     --access-logfile -
