from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserSettingsUpdate
from utils.security import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/settings")
def get_settings(current_user: User = Depends(get_current_user)):
    return {
        "gemini_api_key": current_user.gemini_api_key,
        "smtp_username": current_user.smtp_username,
        "smtp_password": current_user.smtp_password,
        "smtp_from_name": current_user.smtp_from_name,
    }

@router.patch("/settings")
def update_settings(settings: UserSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    update_data = settings.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.add(current_user)
    db.commit()
    return {"status": "success"}
