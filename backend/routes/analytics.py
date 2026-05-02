import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.rate_limiter import gemini_limiter
from models.user import User
from utils.security import get_current_user
from services.analytics_service import get_analytics_data

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/quota")
def get_quota_status(current_user: User = Depends(get_current_user)) -> dict:
    return gemini_limiter.status()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    return get_analytics_data(current_user.id, db)
