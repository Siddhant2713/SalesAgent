"""
campaign_orchestrator.py — Async pipeline engine for campaign generation.

Replaces the synchronous for-loop in routes/campaign.py.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from services.llm_router import build_provider
from services.enrichment_cache import EnrichmentCache
from services.providers.base import EnrichmentResult, GenerationResult

logger = logging.getLogger(__name__)

PIPELINE_WIDTH = 1  # Concurrent leads in-flight


@dataclass
class LeadPipelineResult:
    lead_id: int
    lead_name: str
    company: str
    enrichment: Optional[Dict[str, Any]]
    variants: Dict[str, Dict[str, str]] # {"friendly": {...}, "direct": {...}, "curiosity": {...}}
    success: bool
    error: Optional[str] = None


async def process_single_lead(
    lead,
    provider,
    cache: EnrichmentCache,
    semaphore: asyncio.Semaphore,
) -> LeadPipelineResult:
    """
    Full pipeline for a single lead: enrich → generate.
    Semaphore limits how many leads run concurrently.
    """
    async with semaphore:
        logger.info(f"Pipeline start: lead={lead.id} company={lead.company}")

        # ── Stage 1: Enrichment ───────────────────────────────────────────
        enrichment: Optional[EnrichmentResult] = cache.get(lead.company)

        if enrichment is None:
            enrichment = await provider.enrich(lead.company, lead.role)
            if enrichment:
                cache.set(lead.company, enrichment)
                logger.info(f"Enrichment done: {lead.company} stage={enrichment.company_stage}")
            else:
                logger.info(f"Enrichment skipped (failed/empty): {lead.company}")

        # ── Stage 2: Generation ───────────────────────────────────────────
        try:
            result: GenerationResult = await provider.generate(
                lead_name=lead.name,
                lead_role=lead.role,
                lead_company=lead.company,
                sender_name="",  # Populated by caller via user.smtp_from_name
                enrichment=enrichment,
            )
        except Exception as e:
            logger.error(f"Generation failed for lead {lead.id}: {e}")
            return LeadPipelineResult(
                lead_id=lead.id, lead_name=lead.name, company=lead.company,
                enrichment=None, variants={}, success=False, error=str(e)
            )

        # Serialize for response
        enrichment_dict = None
        if enrichment:
            enrichment_dict = {
                "company_stage": enrichment.company_stage,
                "likely_pain_points": enrichment.likely_pain_points,
                "best_hook": enrichment.best_hook,
                "tone_recommendation": enrichment.tone_recommendation,
            }

        return LeadPipelineResult(
            lead_id=lead.id,
            lead_name=lead.name,
            company=lead.company,
            enrichment=enrichment_dict,
            variants={
                "friendly":  {"subject": result.friendly.subject,  "body": result.friendly.body},
                "direct":    {"subject": result.direct.subject,    "body": result.direct.body},
                "curiosity": {"subject": result.curiosity.subject, "body": result.curiosity.body},
            },
            success=True,
        )


async def orchestrate_campaign(
    leads: List[Any],
    user: Any,
    user_id: int,
    db=None
) -> List[LeadPipelineResult]:
    """
    Entry point called from routes/campaign.py (for sync calls if any).
    """
    provider = build_provider(user, user_id)
    cache = EnrichmentCache(db=db)
    semaphore = asyncio.Semaphore(PIPELINE_WIDTH)

    tasks = [
        process_single_lead(lead, provider, cache, semaphore)
        for lead in leads
    ]

    results = await asyncio.gather(*tasks, return_exceptions=False)
    final_results = []
    for r in results:
        if isinstance(r, Exception):
            logger.error(f"Unexpected error in pipeline: {r}")
            continue
        final_results.append(r)
    
    return final_results


async def run_campaign_pipeline(campaign_id: int, lead_ids: List[int], user_id: int, db_session_factory):
    """
    Background task to run the campaign pipeline.
    Uses a fresh session and refetches models to avoid detached session errors.
    """
    from models.campaign import Campaign, Message, PipelineJob
    from models.lead import Lead
    from models.user import User
    
    db = db_session_factory()
    try:
        # Refetch User and Leads in this session
        user = db.query(User).filter(User.id == user_id).first()
        leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
        
        if not user or not leads:
            logger.error(f"Background job failed: User {user_id} or leads not found")
            return

        # Update Job Status to running
        job = db.query(PipelineJob).filter(PipelineJob.campaign_id == campaign_id).first()
        if job:
            job.status = "running"
            job.started_at = datetime.now(timezone.utc)
            db.commit()

        provider = build_provider(user, user.id)
        cache = EnrichmentCache(db=db)
        semaphore = asyncio.Semaphore(PIPELINE_WIDTH)

        processed = 0
        succeeded = 0
        failed = 0

        async def wrapped_process(lead):
            nonlocal processed, succeeded, failed
            res = await process_single_lead(lead, provider, cache, semaphore)
            processed += 1
            if res.success:
                succeeded += 1
                for tone, variant in res.variants.items():
                    msg = Message(
                        lead_id=res.lead_id,
                        campaign_id=campaign_id,
                        tone=tone,
                        message_type="initial",
                        subject=variant.get("subject", ""),
                        body=variant.get("body", ""),
                        sent=False,
                        is_selected=False
                    )
                    db.add(msg)
            else:
                failed += 1
            
            if job:
                job.processed = processed
                job.succeeded = succeeded
                job.failed = failed
                db.commit()
            return res

        tasks = [wrapped_process(lead) for lead in leads]
        await asyncio.gather(*tasks)

        # Finalize job and campaign status
        if job:
            job.status = "done"
            job.finished_at = datetime.now(timezone.utc)
        
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = "ready"
        
        db.commit()

    except Exception as e:
        logger.error(f"Background campaign pipeline failed: {e}")
        if job:
            job.status = "error"
            job.error_message = str(e)
            job.finished_at = datetime.now(timezone.utc)
        
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = "error"
        db.commit()
    finally:
        db.close()
