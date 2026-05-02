"""
enrichment_service.py

Uses Gemini with Google Search grounding to research a company
before generating cold outreach emails. Returns structured analysis
including company stage, pain points, best hook, and tone recommendation.

This is the "AI Agent" layer — Gemini reasons about the target
company and provides context that makes emails hyper-personalized.
"""

import json
import logging
from google import genai
from google.genai import types
from utils.encryption import decrypt

logger = logging.getLogger(__name__)

MODEL = "gemini-2.5-flash"


def enrich_lead_context(company: str, role: str, current_user) -> dict:
    """
    Use Gemini with Google Search grounding to analyze a company
    and determine the best cold email approach.
    
    Returns:
        dict with keys: company_stage, likely_pain_points, best_hook, tone_recommendation
        Returns empty dict if enrichment fails (non-blocking).
    """
    api_key = decrypt(current_user.gemini_api_key) if current_user.gemini_api_key else ""
    if not api_key:
        return {}
    
    prompt = (
        f"Research the company '{company}' and analyze the best approach for a cold sales email "
        f"to their {role}.\n\n"
        f"Determine:\n"
        f"1. What stage is this company at? (early_startup, growth_stage, or enterprise)\n"
        f"2. What are their 2-3 most likely pain points based on their stage and industry?\n"
        f"3. What is the single most compelling hook or angle for cold outreach?\n"
        f"4. Which tone would work best: friendly, direct, or curiosity?\n\n"
        f"Return ONLY valid JSON in this exact format:\n"
        f'{{\n'
        f'  "company_stage": "early_startup | growth_stage | enterprise",\n'
        f'  "likely_pain_points": ["pain point 1", "pain point 2"],\n'
        f'  "best_hook": "The single most compelling angle for outreach",\n'
        f'  "tone_recommendation": "friendly | direct | curiosity"\n'
        f'}}'
    )
    
    try:
        client = genai.Client(api_key=api_key)
        
        # NOTE: response_mime_type="application/json" is NOT compatible with tools
        # so we omit it and parse JSON manually from the response
        config = types.GenerateContentConfig(
            temperature=0.4,
            max_output_tokens=512,
            tools=[types.Tool(google_search=types.GoogleSearch())],
        )
        
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=config,
        )
        
        raw = response.text.strip()
        logger.info(f"Enrichment for {company}: {raw[:200]}...")
        
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        
        result = json.loads(raw)
        
        # Validate required fields exist
        required = {"company_stage", "likely_pain_points", "best_hook", "tone_recommendation"}
        if not required.issubset(set(result.keys())):
            logger.warning(f"Enrichment response missing fields for {company}")
            return {}
        
        return result
        
    except Exception as e:
        # Enrichment is non-blocking — if it fails, we still generate emails normally
        logger.warning(f"Enrichment failed for {company}: {e}. Proceeding without enrichment.")
        return {}

