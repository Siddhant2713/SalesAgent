import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine
from models import lead as lead_model, campaign as campaign_model
from routes import leads, campaign as campaign_router, analytics
from middleware.security import SecurityHeadersMiddleware

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Database ──────────────────────────────────────────────────────────────────
lead_model.Base.metadata.create_all(bind=engine)
campaign_model.Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SalesAgent API",
    version="1.0.0",
    docs_url="/api/docs",      # Swagger UI at /api/docs
    redoc_url=None,            # Disable ReDoc to keep surface area small
)

# ── Middleware (order matters — added last, runs first) ───────────────────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

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
app.include_router(leads.router,           prefix="/api/leads",     tags=["leads"])
app.include_router(campaign_router.router, prefix="/api/campaign",  tags=["campaign"])
app.include_router(analytics.router,       prefix="/api/analytics", tags=["analytics"])

@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
