import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine
from models import lead as lead_model, campaign as campaign_model, user as user_model, enrichment_cache as cache_model
from routes import leads, campaign as campaign_router, analytics, auth, user
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Database ──────────────────────────────────────────────────────────────────
# Note: create_all is safe to call multiple times; it won't drop existing tables.
user_model.Base.metadata.create_all(bind=engine)
lead_model.Base.metadata.create_all(bind=engine)
campaign_model.Base.metadata.create_all(bind=engine)
cache_model.Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SalesAgent API",
    version="2.1.0",
    docs_url="/api/docs",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Added early to ensure it wraps error responses
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
render_url = os.environ.get("RENDER_EXTERNAL_URL")
if render_url:
    allowed_origins.append(render_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True, # Changed to True for better compatibility with dev environments
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers (Refactored to be simpler) ───────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.error("Unhandled error on %s: %s", request.url, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."}
    )

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(leads.router,           prefix="/api/leads",     tags=["leads"])
app.include_router(campaign_router.router, prefix="/api/campaign",  tags=["campaign"])
app.include_router(analytics.router,       prefix="/api/analytics", tags=["analytics"])

@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "version": "2.1.0"}

# ── Static File Serving ───────────────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
