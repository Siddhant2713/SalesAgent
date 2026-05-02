import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_
from typing import List
import smtplib

from database import get_db
from models.lead import Lead
from models.campaign import Campaign, Message
from models.user import User
from schemas.campaign import GenerateRequest, SendCampaignRequest
from services.ai_service import generate_messages, generate_followup
from services.email_service import send_email
from services.tracking_service import get_followup_tone
from services.rate_limiter import gemini_limiter, QuotaExceededError
from utils.security import get_current_user
from utils.limiter import limiter
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate")
@limiter.limit("5/minute")
def generate(request: Request, payload: GenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="Please configure your Gemini API Key in Settings first.")
        
    leads = db.query(Lead).filter(Lead.user_id == current_user.id, Lead.id.in_(payload.lead_ids)).all()
    if len(leads) != len(payload.lead_ids):
        raise HTTPException(status_code=404, detail="One or more leads not found or you don't have access")

    calls_needed = len(leads)
    remaining = gemini_limiter.daily_remaining

    if calls_needed > remaining:
        raise HTTPException(
            status_code=429,
            detail=(f"Insufficient daily API quota. Need {calls_needed} calls, only {remaining} remaining today.")
        )

    campaign = Campaign(user_id=current_user.id, name=payload.campaign_name)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    generated_count = 0
    skipped_count = 0
    messages_response = []

    for lead in leads:
        existing = db.query(Message).filter(
            Message.lead_id == lead.id,
            Message.campaign_id == campaign.id,
            Message.message_type == "initial"
        ).first()

        if existing:
            skipped_count += 1
            continue

        try:
            # We must pass current_user to ai_service so it can use their specific API key
            variants = generate_messages(lead, current_user)
            
            # Extract enrichment data (added by enrichment pipeline)
            enrichment = variants.pop("_enrichment", {})
            
            lead_messages_res = {
                "lead_id": lead.id,
                "lead_name": lead.name,
                "company": lead.company,
                "enrichment": enrichment,
                "variants": {}
            }

            for tone in ["friendly", "direct", "curiosity"]:
                variant = variants.get(tone)
                if not variant:
                    continue

                msg = Message(
                    lead_id=lead.id,
                    campaign_id=campaign.id,
                    tone=tone,
                    message_type="initial",
                    subject=variant.get("subject", ""),
                    body=variant.get("body", ""),
                    sent=False,
                    is_selected=False
                )
                db.add(msg)
                lead_messages_res["variants"][tone] = variant
                
            db.commit()
            messages_response.append(lead_messages_res)
            generated_count += 1

        except QuotaExceededError as e:
            logger.warning(f"Quota exceeded during generation for lead {lead.id}: {e}")
            db.rollback()
            raise HTTPException(status_code=429, detail=f"API quota exceeded: {e}")
        except google_exceptions.ResourceExhausted as e:
            logger.warning(f"Gemini rate limit hit for lead {lead.id}: {e}")
            db.rollback()
            raise HTTPException(status_code=429, detail="Gemini API rate limit reached. Please wait and try again.")
        except ValueError as e:
            logger.error(f"Failed to parse AI response for lead {lead.id}: {e}")
            db.rollback()
            raise HTTPException(status_code=502, detail=f"AI response parsing failed: {e}")
        except Exception as e:
            import traceback
            logger.error(f"Unexpected error generating for lead {lead.id}: {e}\n{traceback.format_exc()}")
            db.rollback()
            raise HTTPException(status_code=502, detail=f"Gemini API failure: {e}")

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "generated_count": generated_count,
        "skipped_count": skipped_count,
        "messages": messages_response
    }

@router.post("/{campaign_id}/send")
def send_campaign(campaign_id: int, payload: SendCampaignRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    if not current_user.smtp_password or not current_user.smtp_username:
        raise HTTPException(status_code=400, detail="Please configure your SMTP Settings first.")

    campaign = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    messages = db.query(Message).options(
        joinedload(Message.lead)
    ).filter(
        Message.campaign_id == campaign.id,
        Message.tone == payload.tone,
        Message.sent == False,
        Message.message_type == "initial"
    ).all()

    if not messages:
        raise HTTPException(status_code=400, detail="No messages to send for this tone")

    sent_count = 0
    failures = []

    for msg in messages:
        lead = msg.lead
        try:
            send_email(lead.email, msg.subject, msg.body, current_user)
            msg.sent = True
            msg.sent_at = func.now()
            msg.is_selected = True
            lead.status = "contacted"
            db.commit()
            sent_count += 1
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending to {lead.email}: {e}")
            failures.append({
                "lead_id": lead.id,
                "email": lead.email,
                "error": str(e)
            })
        except Exception as e:
            logger.error(f"Failed to send email to {lead.email}: {e}")
            failures.append({
                "lead_id": lead.id,
                "email": lead.email,
                "error": str(e)
            })

    return {
        "sent": sent_count,
        "failed": len(failures),
        "failures": failures
    }

@router.post("/{campaign_id}/followup")
def followup(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    campaign = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contacted_leads = db.query(Lead).join(Message).filter(
        Message.campaign_id == campaign.id,
        Message.message_type == "initial",
        Message.sent == True,
        Message.is_selected == True,
        Lead.status == "contacted"
    ).all()

    followups_sent = 0
    failures = []

    for lead in contacted_leads:
        already_followed_up = db.query(Message).filter(
            Message.lead_id == lead.id,
            Message.campaign_id == campaign_id,
            Message.message_type == "followup"
        ).first()

        if already_followed_up:
            continue

        initial_msg = db.query(Message).filter(
            Message.lead_id == lead.id,
            Message.campaign_id == campaign.id,
            Message.message_type == "initial",
            Message.is_selected == True
        ).first()

        if not initial_msg:
            continue

        initial_tone = initial_msg.tone
        followup_tone = get_followup_tone(initial_tone)

        if gemini_limiter.daily_remaining < 1:
            break

        try:
            variant = generate_followup(lead, initial_tone, followup_tone, current_user)
            followup_msg = Message(
                lead_id=lead.id,
                campaign_id=campaign.id,
                tone=followup_tone,
                message_type="followup",
                subject=variant.get("subject", ""),
                body=variant.get("body", ""),
                sent=False,
                is_selected=True
            )
            db.add(followup_msg)
            db.commit()

            try:
                send_email(lead.email, followup_msg.subject, followup_msg.body, current_user)
                followup_msg.sent = True
                followup_msg.sent_at = func.now()
                db.commit()
                followups_sent += 1
            except Exception as e:
                failures.append({"lead_id": lead.id, "email": lead.email, "error": str(e)})

        except Exception as e:
            continue

    return {
        "followups_sent": followups_sent,
        "failed": len(failures),
        "failures": failures
    }

@router.get("")
def get_campaigns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[dict]:
    campaign_stats = db.query(
        Campaign.id,
        Campaign.name,
        Campaign.created_at,
        func.count(func.distinct(Message.lead_id)).label("lead_count"),
        func.count(func.distinct(case((and_(Message.sent == True, Message.message_type == "initial"), Message.lead_id)))).label("sent_count"),
        func.count(func.distinct(case((and_(Message.sent == True, Lead.status == "replied"), Lead.id)))).label("reply_count")
    ).outerjoin(Message, Message.campaign_id == Campaign.id)\
     .outerjoin(Lead, Lead.id == Message.lead_id)\
     .filter(Campaign.user_id == current_user.id)\
     .group_by(Campaign.id)\
     .order_by(Campaign.id.desc()).all()

    res = []
    for c in campaign_stats:
        res.append({
            "id": c.id,
            "name": c.name,
            "created_at": c.created_at,
            "lead_count": c.lead_count,
            "sent_count": c.sent_count,
            "reply_count": c.reply_count
        })
    return res

@router.get("/{campaign_id}/messages")
def get_campaign_messages(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[dict]:
    campaign = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    messages = db.query(Message).options(joinedload(Message.lead)).filter(Message.campaign_id == campaign.id).all()
    res = []
    for m in messages:
        res.append({
            "lead_id": m.lead_id,
            "lead_name": m.lead.name,
            "email": m.lead.email,
            "tone": m.tone,
            "message_type": m.message_type,
            "subject": m.subject,
            "body": m.body,
            "sent": m.sent,
            "sent_at": m.sent_at
        })
    return res
