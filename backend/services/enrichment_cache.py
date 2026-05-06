"""
enrichment_cache.py — Two-level cache for company enrichment results.

Level 1: In-memory dict (per-process, per-request reuse)
Level 2: DB table enrichment_cache (persists 24h across restarts)

Cache key: sha256(company_name.lower().strip())
TTL: 24 hours
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)


def _company_key(company_name: str) -> str:
    return hashlib.sha256(company_name.lower().strip().encode()).hexdigest()[:32]


class EnrichmentCache:
    """
    In-memory cache scoped to a single orchestrate_campaign() call.
    Backed by the DB on miss for cross-request persistence.
    """

    def __init__(self, db=None):
        self._memory: dict = {}
        self._db = db

    def get(self, company_name: str):
        """Returns cached EnrichmentResult or None on miss."""
        key = _company_key(company_name)
        
        # Level 1: Memory
        if key in self._memory:
            logger.debug(f"Enrichment cache HIT (memory): {company_name}")
            return self._memory[key]
        
        # Level 2: DB
        if self._db:
            result = DBEnrichmentCache.get(company_name, self._db)
            if result:
                # We need to wrap it in an EnrichmentResult like object or just use dicts
                # For simplicity, we'll store EnrichmentResult objects in memory
                # and dicts in DB.
                from services.providers.base import EnrichmentResult
                wrapped = EnrichmentResult(
                    company_stage=result["company_stage"],
                    likely_pain_points=result["likely_pain_points"],
                    best_hook=result["best_hook"],
                    tone_recommendation=result["tone_recommendation"],
                    source_provider="cached"
                )
                self._memory[key] = wrapped
                logger.debug(f"Enrichment cache HIT (DB): {company_name}")
                return wrapped
                
        return None

    def set(self, company_name: str, result) -> None:
        """Store in memory and DB cache."""
        key = _company_key(company_name)
        self._memory[key] = result
        logger.debug(f"Enrichment cache SET (memory): {company_name}")
        
        if self._db:
            DBEnrichmentCache.set(company_name, result, self._db)


class DBEnrichmentCache:
    """
    Database-backed enrichment cache for cross-request persistence.
    """

    @staticmethod
    def get(company_name: str, db) -> Optional[dict]:
        from models.enrichment_cache import EnrichmentCacheEntry
        key = _company_key(company_name)
        now = datetime.now(timezone.utc)
        entry = db.query(EnrichmentCacheEntry).filter(
            EnrichmentCacheEntry.company_key == key,
            EnrichmentCacheEntry.expires_at > now
        ).first()
        if not entry:
            return None
        return {
            "company_stage": entry.stage,
            "likely_pain_points": json.loads(entry.pain_points or "[]"),
            "best_hook": entry.best_hook,
            "tone_recommendation": entry.tone,
        }

    @staticmethod
    def set(company_name: str, result, db) -> None:
        from models.enrichment_cache import EnrichmentCacheEntry
        key = _company_key(company_name)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        entry = db.query(EnrichmentCacheEntry).filter(
            EnrichmentCacheEntry.company_key == key
        ).first()
        
        # result can be EnrichmentResult or dict
        if hasattr(result, "company_stage"):
            stage = result.company_stage
            pain_points = result.likely_pain_points
            hook = result.best_hook
            tone = result.tone_recommendation
        else:
            stage = result.get("company_stage")
            pain_points = result.get("likely_pain_points", [])
            hook = result.get("best_hook")
            tone = result.get("tone_recommendation")

        data = {
            "company_key": key,
            "company_name": company_name,
            "stage": stage,
            "pain_points": json.dumps(pain_points),
            "best_hook": hook,
            "tone": tone,
            "expires_at": expires,
        }
        
        if entry:
            for k, v in data.items():
                setattr(entry, k, v)
        else:
            entry = EnrichmentCacheEntry(**data)
            db.add(entry)
        db.commit()
