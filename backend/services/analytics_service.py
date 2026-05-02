from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from models.lead import Lead
from models.campaign import Campaign, Message
from utils.cache import ttl_cache

@ttl_cache(ttl_seconds=30)
def get_analytics_data(user_id: int, db: Session) -> dict:
    total_leads = db.query(Lead).filter(Lead.user_id == user_id).count()
    
    # Calculate overall stats using aggregation
    overall_stats = db.query(
        func.count(Message.id).filter(Message.sent == True).label("emails_sent"),
    ).join(Campaign).filter(Campaign.user_id == user_id).first()
    
    emails_sent = overall_stats.emails_sent or 0
    replies = db.query(Lead).filter(Lead.user_id == user_id, Lead.status == "replied").count()
    
    reply_rate = 0.0
    if emails_sent > 0:
        reply_rate = round((replies / emails_sent) * 100, 1)
        
    # Tone stats via single aggregated query
    tone_results = db.query(
        Message.tone,
        func.count(Message.id).filter(Message.sent == True).label("sent"),
        func.count(func.distinct(case((Lead.status == "replied", Lead.id)))).label("replies")
    ).join(Lead).join(Campaign).filter(
        Campaign.user_id == user_id,
        Message.is_selected == True
    ).group_by(Message.tone).all()
    
    tone_stats = {}
    best_tone = None
    best_rate = -1.0
    
    # Pre-fill tones
    for tone in ["friendly", "direct", "curiosity"]:
        tone_stats[tone] = {"sent": 0, "replies": 0, "reply_rate": 0.0}
        
    for tone, sent, tone_replies in tone_results:
        rate = 0.0
        if sent > 0:
            rate = round((tone_replies / sent) * 100, 1)
            
        tone_stats[tone] = {
            "sent": sent,
            "replies": tone_replies,
            "reply_rate": rate
        }
        if tone_replies > 0 and rate > best_rate:
            best_rate = rate
            best_tone = tone
            
    return {
        "total_leads": total_leads,
        "emails_sent": emails_sent,
        "replies": replies,
        "reply_rate": reply_rate,
        "best_tone": best_tone,
        "tone_stats": tone_stats
    }
