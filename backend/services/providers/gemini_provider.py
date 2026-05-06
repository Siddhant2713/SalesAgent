"""
gemini_provider.py — Gemini implementation of BaseLLMProvider.

Migrates logic from ai_service.py and enrichment_service.py
into the unified provider interface.
"""

import asyncio
import json
import logging
import re
import time
from typing import Optional

from google import genai
from google.genai import types
from google.api_core import exceptions as google_exceptions

from .base import (
    BaseLLMProvider, ProviderConfig,
    EnrichmentResult, GenerationResult, FollowupResult, EmailVariantResult,
)
from services.rate_limiter import get_limiter_for_user
from schemas.gemini_output import InitialEmailSet, FollowupEmail
from utils.prompts import SYSTEM_PROMPT, build_initial_prompt, build_followup_prompt

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """
    Gemini 2.5 Flash provider.

    Uses Google Search grounding for enrichment.
    Uses response_schema structured output for generation.
    Per-user rate limiter (not global singleton).
    All API calls are async via asyncio.to_thread() since
    google-genai SDK is synchronous.
    """

    def __init__(self, config: ProviderConfig, user_id: int):
        super().__init__(config)
        self._user_id = user_id
        self._client = genai.Client(api_key=config.api_key)

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _get_limiter(self):
        return get_limiter_for_user(
            user_id=self._user_id,
            api_key_hash=hash(self.config.api_key),
            max_rpm=self.config.max_rpm,
            max_rpd=self.config.max_rpd,
            inter_request_delay=self.config.inter_request_delay,
        )

    def _call_sync(self, prompt: str, response_schema=None, use_grounding: bool = False) -> str:
        """
        Synchronous Gemini call. Called via asyncio.to_thread() in async methods.
        Handles rate limiting, retries, and JSON extraction.
        """
        limiter = self._get_limiter()

        config_kwargs: dict = {
            "temperature": (
                self.config.temperature_enrich if use_grounding
                else self.config.temperature_generate
            ),
            "max_output_tokens": (
                self.config.max_tokens_enrich if use_grounding
                else self.config.max_tokens_generate
            ),
        }

        if use_grounding:
            # Note: response_mime_type is incompatible with tools — intentionally omitted
            config_kwargs["tools"] = [types.Tool(google_search=types.GoogleSearch())]
        else:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["system_instruction"] = SYSTEM_PROMPT
            if response_schema:
                config_kwargs["response_schema"] = response_schema

        for attempt in range(2):  # 1 retry on non-quota errors
            try:
                limiter.acquire()
                response = self._client.models.generate_content(
                    model=self.config.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(**config_kwargs),
                )
                return response.text
            except google_exceptions.ResourceExhausted:
                if attempt == 0:
                    logger.warning("Gemini ResourceExhausted. Waiting 60s before retry.")
                    time.sleep(60)
                    continue
                raise
            except Exception:
                if attempt == 0:
                    time.sleep(2)
                    continue
                raise

    @staticmethod
    def _strip_json(text: str) -> dict:
        text = text.strip()
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
        return json.loads(text)

    async def enrich(self, company: str, role: str) -> Optional[EnrichmentResult]:
        prompt = (
            f"Research the company '{company}' and analyze the best approach for a cold "
            f"sales email to their {role}.\n\n"
            f"Determine:\n"
            f"1. Company stage: early_startup, growth_stage, or enterprise\n"
            f"2. 2-3 most likely pain points\n"
            f"3. Single most compelling cold outreach hook\n"
            f"4. Best tone: friendly, direct, or curiosity\n\n"
            f"Return ONLY valid JSON:\n"
            f'{{"company_stage":"...","likely_pain_points":["..."],"best_hook":"...","tone_recommendation":"..."}}'
        )
        try:
            raw = await asyncio.to_thread(self._call_sync, prompt, None, True)
            if not raw:
                logger.warning(f"Enrichment returned empty response for {company}")
                return None
            
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()
            data = json.loads(raw)
            required = {"company_stage", "likely_pain_points", "best_hook", "tone_recommendation"}
            if not required.issubset(data.keys()):
                logger.warning(f"Enrichment missing fields for {company}")
                return None
            return EnrichmentResult(
                company_stage=data["company_stage"],
                likely_pain_points=data["likely_pain_points"],
                best_hook=data["best_hook"],
                tone_recommendation=data["tone_recommendation"],
                source_provider="gemini",
            )
        except Exception as e:
            logger.warning(f"Enrichment failed for {company}: {e}")
            return None

    async def generate(
        self,
        lead_name: str, lead_role: str, lead_company: str,
        sender_name: str, enrichment: Optional[EnrichmentResult],
    ) -> GenerationResult:
        # Convert EnrichmentResult back to dict for prompt builder
        enrichment_dict = None
        if enrichment:
            enrichment_dict = {
                "company_stage": enrichment.company_stage,
                "likely_pain_points": enrichment.likely_pain_points,
                "best_hook": enrichment.best_hook,
                "tone_recommendation": enrichment.tone_recommendation,
            }
        prompt = build_initial_prompt(
            lead_name, lead_role, lead_company, sender_name, context=enrichment_dict
        )
        try:
            raw = await asyncio.to_thread(
                self._call_sync, prompt, InitialEmailSet, False
            )
            data = self._strip_json(raw)
        except Exception:
            # Fallback: raw JSON without schema
            raw = await asyncio.to_thread(self._call_sync, prompt, None, False)
            data = self._strip_json(raw)

        def _variant(d: dict) -> EmailVariantResult:
            return EmailVariantResult(subject=d.get("subject", ""), body=d.get("body", ""))

        return GenerationResult(
            friendly=_variant(data.get("friendly", {})),
            direct=_variant(data.get("direct", {})),
            curiosity=_variant(data.get("curiosity", {})),
            source_provider="gemini",
        )

    async def followup(
        self, lead_name: str, lead_role: str, lead_company: str,
        sender_name: str, initial_tone: str, followup_tone: str,
    ) -> FollowupResult:
        prompt = build_followup_prompt(
            lead_name, lead_role, lead_company, initial_tone, followup_tone, sender_name
        )
        try:
            raw = await asyncio.to_thread(
                self._call_sync, prompt, FollowupEmail, False
            )
            data = self._strip_json(raw)
        except Exception:
            raw = await asyncio.to_thread(self._call_sync, prompt, None, False)
            data = self._strip_json(raw)
        return FollowupResult(
            subject=data.get("subject", ""),
            body=data.get("body", ""),
            source_provider="gemini",
        )
