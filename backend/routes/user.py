from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserSettingsUpdate
from utils.security import get_current_user
from utils.encryption import encrypt, decrypt

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return current_user

@router.get("/settings")
def get_settings(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "gemini_api_key": decrypt(current_user.gemini_api_key) if current_user.gemini_api_key else "",
        "smtp_username": current_user.smtp_username or "",
        "smtp_password": decrypt(current_user.smtp_password) if current_user.smtp_password else "",
        "smtp_from_name": current_user.smtp_from_name or "",
    }

@router.patch("/settings")
def update_settings(settings: UserSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    from fastapi import HTTPException
    update_data = settings.dict(exclude_unset=True)
    
    # Validate Gemini API key format if provided
    gemini_key = update_data.get("gemini_api_key")
    if gemini_key and gemini_key.strip():
        key = gemini_key.strip()
        if not key.startswith("AIza") or len(key) != 39:
            raise HTTPException(
                status_code=422,
                detail="Invalid Gemini API key format. Keys start with 'AIza' and are 39 characters long. Get yours from Google AI Studio."
            )
    
    # Encrypt sensitive fields before storing
    SENSITIVE_FIELDS = {"gemini_api_key", "smtp_password"}
    for field, value in update_data.items():
        if field in SENSITIVE_FIELDS and value:
            setattr(current_user, field, encrypt(value))
        else:
            setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    return {"status": "success"}
