import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from services.rate_limiter import gemini_limiter
from models.lead import Lead
from models.campaign import Message

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/quota")
def get_quota_status():
    return gemini_limiter.status()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    
    # Calculate emails sent
    emails_sent = db.query(Message).filter(Message.sent == True).count()
    
    # Calculate replies
    replies = db.query(Lead).filter(Lead.status == "replied").count()
    
    reply_rate = 0.0
    if emails_sent > 0:
        reply_rate = round((replies / emails_sent) * 100, 1)
        
    # Tone stats
    tones = ["friendly", "direct", "curiosity"]
    tone_stats = {}
    
    for tone in tones:
        # sent is determined by messages with this tone and sent=True
        sent = db.query(Message).filter(Message.tone == tone, Message.sent == True).count()
        
        # replies for this tone. We need to find leads that replied AND their sent message was this tone
        # To simplify, we count replies where the lead's status is replied, and they have a sent message with this tone.
        # This is an approximation as per simple V1 requirements.
        replies_for_tone = db.query(Lead).join(Message).filter(
            Lead.status == "replied", 
            Message.tone == tone, 
            Message.sent == True,
            Message.is_selected == True
        ).count()
        
        rate = 0.0
        if sent > 0:
            rate = round((replies_for_tone / sent) * 100, 1)
            
        tone_stats[tone] = {
            "sent": sent,
            "replies": replies_for_tone,
            "reply_rate": rate
        }
        
    # Best tone
    best_tone = None
    best_rate = -1.0
    for tone, stats in tone_stats.items():
        if stats["replies"] > 0 and stats["reply_rate"] > best_rate:
            best_rate = stats["reply_rate"]
            best_tone = tone
            
    return {
        "total_leads": total_leads,
        "emails_sent": emails_sent,
        "replies": replies,
        "reply_rate": reply_rate,
        "best_tone": best_tone,
        "tone_stats": tone_stats
    }
