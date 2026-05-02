import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
import smtplib

from database import get_db
from models.lead import Lead
from models.campaign import Campaign, Message
from schemas.campaign import GenerateRequest, SendCampaignRequest
from services.ai_service import generate_messages, generate_followup
from services.email_service import send_email
from services.tracking_service import get_followup_tone
from services.rate_limiter import gemini_limiter

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate")
def generate(payload: GenerateRequest, db: Session = Depends(get_db)):
    leads = db.query(Lead).filter(Lead.id.in_(payload.lead_ids)).all()
    if len(leads) != len(payload.lead_ids):
        raise HTTPException(status_code=404, detail="One or more leads not found")

    # Each lead costs 1 API call (all 3 tones in one call)
    calls_needed = len(leads)
    remaining = gemini_limiter.daily_remaining

    if calls_needed > remaining:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Insufficient daily API quota. Need {calls_needed} calls, "
                f"only {remaining} remaining today (resets at midnight). "
                f"Reduce your lead selection to {remaining} or fewer."
            )
        )

    campaign = Campaign(name=payload.campaign_name)
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
            continue  # Do not call Gemini again

        try:
            variants = generate_messages(lead)
            
            lead_messages_res = {
                "lead_id": lead.id,
                "lead_name": lead.name,
                "company": lead.company,
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

        except Exception as e:
            logger.error(f"Failed to generate for lead {lead.id}: {e}")
            db.rollback()
            # If Anthropic/Gemini fails, we might return 502, but spec says sequential so we shouldn't abort all unless it's a hard fail.
            # "Process leads sequentially (not in parallel) to avoid rate-limit issues with Anthropic API."
            # The spec says "Errors: 502 — Anthropic API failure (include error detail)." So we raise.
            raise HTTPException(status_code=502, detail=f"Gemini API failure: {e}")

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "generated_count": generated_count,
        "skipped_count": skipped_count,
        "messages": messages_response
    }

@router.post("/{campaign_id}/send")
def send_campaign(campaign_id: int, payload: SendCampaignRequest, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    messages = db.query(Message).filter(
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
        lead = db.query(Lead).filter(Lead.id == msg.lead_id).first()
        try:
            send_email(lead.email, msg.subject, msg.body)
            msg.sent = True
            msg.sent_at = func.now()
            msg.is_selected = True
            lead.status = "contacted"
            db.commit()
            sent_count += 1
        except smtplib.SMTPException as e:
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
def followup(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Find leads in this campaign with status contacted (sent but not replied)
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

        # Quota check
        if gemini_limiter.daily_remaining < 1:
            logger.warning("Quota exhausted during followups")
            break

        try:
            variant = generate_followup(lead, initial_tone, followup_tone)
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
                send_email(lead.email, followup_msg.subject, followup_msg.body)
                followup_msg.sent = True
                followup_msg.sent_at = func.now()
                db.commit()
                followups_sent += 1
            except smtplib.SMTPException as e:
                logger.error(f"Failed to send follow-up to {lead.email}: {e}")
                failures.append({
                    "lead_id": lead.id,
                    "email": lead.email,
                    "error": str(e)
                })

        except Exception as e:
            logger.error(f"Failed to generate follow-up for lead {lead.id}: {e}")
            continue

    return {
        "followups_sent": followups_sent,
        "failed": len(failures),
        "failures": failures
    }

@router.get("")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).all()
    res = []
    for c in campaigns:
        # Get stats
        leads_count = db.query(Message.lead_id).filter(Message.campaign_id == c.id).distinct().count()
        sent_count = db.query(Message.lead_id).filter(Message.campaign_id == c.id, Message.sent == True, Message.message_type == "initial").distinct().count()
        # Reply count for this campaign... leads that are replied and were contacted in this campaign
        reply_count = db.query(Lead).join(Message).filter(Message.campaign_id == c.id, Message.sent == True, Lead.status == "replied").distinct().count()
        
        res.append({
            "id": c.id,
            "name": c.name,
            "created_at": c.created_at,
            "lead_count": leads_count,
            "sent_count": sent_count,
            "reply_count": reply_count
        })
    return res

@router.get("/{campaign_id}/messages")
def get_campaign_messages(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    messages = db.query(Message).filter(Message.campaign_id == campaign.id).all()
    res = []
    for m in messages:
        lead = db.query(Lead).filter(Lead.id == m.lead_id).first()
        res.append({
            "lead_id": m.lead_id,
            "lead_name": lead.name,
            "email": lead.email,
            "tone": m.tone,
            "message_type": m.message_type,
            "subject": m.subject,
            "body": m.body,
            "sent": m.sent,
            "sent_at": m.sent_at
        })
    return res
