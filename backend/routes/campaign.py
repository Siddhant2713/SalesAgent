import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_
from typing import List, Dict, Any
import smtplib

from database import get_db, SessionLocal
from models.lead import Lead
from models.campaign import Campaign, Message, PipelineJob
from models.user import User
from schemas.campaign import GenerateRequest, SendCampaignRequest
from services.email_service import send_email
from services.tracking_service import get_followup_tone
from services.rate_limiter import gemini_limiter, QuotaExceededError
from services.campaign_orchestrator import run_campaign_pipeline
from utils.security import get_current_user
from utils.limiter import limiter
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate")
@limiter.limit("5/minute")
async def generate(
    request: Request, 
    payload: GenerateRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> dict:
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="Please configure your Gemini API Key in Settings first.")
        
    leads = db.query(Lead).filter(Lead.user_id == current_user.id, Lead.id.in_(payload.lead_ids)).all()
    if len(leads) != len(payload.lead_ids):
        raise HTTPException(status_code=404, detail="One or more leads not found or you don't have access")

    # Check quota before starting background job
    calls_needed = len(leads) * 2
    remaining = gemini_limiter.daily_remaining

    if calls_needed > remaining:
        raise HTTPException(
            status_code=429,
            detail=(f"Insufficient daily API quota. Need {calls_needed} calls, only {remaining} remaining today.")
        )

    # Create campaign record immediately
    campaign = Campaign(user_id=current_user.id, name=payload.campaign_name, status="generating")
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Create PipelineJob record
    job = PipelineJob(
        campaign_id=campaign.id,
        user_id=current_user.id,
        total_leads=len(leads),
        status="pending"
    )
    db.add(job)
    db.commit()

    # Fire pipeline in background
    lead_ids = [l.id for l in leads]
    background_tasks.add_task(
        run_campaign_pipeline, campaign.id, lead_ids, current_user.id, SessionLocal
    )

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "status": "generating",
        "total_leads": len(leads),
        "estimated_seconds": len(leads) * 8.6,
    }

@router.get("/{campaign_id}/status")
async def get_campaign_status(
    campaign_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> dict:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    job = db.query(PipelineJob).filter(PipelineJob.campaign_id == campaign_id).first()
    if not job:
        return {
            "campaign_id": campaign.id,
            "status": campaign.status,
            "total_leads": 0,
            "processed": 0,
            "succeeded": 0,
            "failed": 0
        }

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "job_status": job.status,
        "total_leads": job.total_leads,
        "processed": job.processed,
        "succeeded": job.succeeded,
        "failed": job.failed,
        "error_message": job.error_message
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

    # Update campaign status if all sent
    remaining = db.query(Message).filter(Message.campaign_id == campaign.id, Message.sent == False).count()
    if remaining == 0:
        campaign.status = "sent"
        db.commit()

    return {
        "sent": sent_count,
        "failed": len(failures),
        "failures": failures
    }

@router.post("/{campaign_id}/followup")
async def followup(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
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
            from services.llm_router import build_provider
            provider = build_provider(current_user, current_user.id)
            
            result = await provider.followup(
                lead_name=lead.name,
                lead_role=lead.role,
                lead_company=lead.company,
                sender_name=current_user.smtp_from_name,
                initial_tone=initial_tone,
                followup_tone=followup_tone
            )
            
            followup_msg = Message(
                lead_id=lead.id,
                campaign_id=campaign.id,
                tone=followup_tone,
                message_type="followup",
                subject=result.subject,
                body=result.body,
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
            logger.error(f"Followup generation failed for lead {lead.id}: {e}")
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
        Campaign.status,
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
            "status": c.status,
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
