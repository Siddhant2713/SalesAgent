import json
import time
import logging
import re
from google import genai
from google.genai import types
from google.api_core import exceptions as google_exceptions

from config import settings
from utils.prompts import SYSTEM_PROMPT, build_initial_prompt, build_followup_prompt
from services.rate_limiter import gemini_limiter, QuotaExceededError
from schemas.gemini_output import InitialEmailSet, FollowupEmail

logger = logging.getLogger(__name__)

MODEL = "gemini-2.5-flash"
MAX_TOKENS = 2048
TEMPERATURE = 0.7


def _call_gemini(prompt: str, current_user, response_schema=None, retries: int = 1) -> str:
    """Call Gemini API with optional structured output schema. Returns raw text."""
    client = genai.Client(api_key=current_user.gemini_api_key)
    
    config_kwargs = {
        "system_instruction": SYSTEM_PROMPT,
        "temperature": TEMPERATURE,
        "max_output_tokens": MAX_TOKENS,
        "response_mime_type": "application/json",
    }
    
    # Use structured output schema if provided (guarantees valid JSON)
    if response_schema:
        config_kwargs["response_schema"] = response_schema
    
    for attempt in range(retries + 1):
        try:
            gemini_limiter.acquire()
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(**config_kwargs)
            )
            return response.text
        except QuotaExceededError:
            raise
        except google_exceptions.ResourceExhausted:
            if attempt < retries:
                logger.warning(f"Gemini API rate limit hit. Retrying in 60s...")
                time.sleep(60)
                continue
            raise
        except Exception as e:
            if attempt < retries:
                logger.warning(f"Gemini API call failed: {e}. Retrying in 2s...")
                time.sleep(2)
                continue
            raise e

def _parse_json(text: str) -> dict:
    """Strip any accidental markdown fences and parse JSON."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    return json.loads(text)

def generate_messages(lead, current_user) -> dict:
    """
    Returns dict with keys: friendly, direct, curiosity.
    Each value is { "subject": str, "body": str }.
    Uses Gemini structured outputs when available for guaranteed JSON.
    Raises ValueError on parse failure after retry.
    Raises Exception on API error.
    """
    prompt = build_initial_prompt(lead.name, lead.role, lead.company, current_user.smtp_from_name)
    logger.debug(f"--- Sending Prompt ---\n{prompt}\n----------------------")
    
    # Try structured output first (guaranteed JSON)
    try:
        raw = _call_gemini(prompt, current_user, response_schema=InitialEmailSet)
        logger.debug(f"--- Raw Response (Structured) ---\n{raw}\n--------------------")
        return _parse_json(raw)
    except (TypeError, google_exceptions.InvalidArgument) as e:
        # Structured output not supported by this model version — fall back
        logger.info(f"Structured output not supported, falling back to raw JSON: {e}")
    
    # Fallback: raw JSON mode with manual parsing + retry
    raw = _call_gemini(prompt, current_user)
    logger.debug(f"--- Raw Response ---\n{raw}\n--------------------")
    try:
        return _parse_json(raw)
    except (json.JSONDecodeError, KeyError):
        logger.warning(f"Failed to parse JSON for lead {lead.id}. Retrying...")
        raw = _call_gemini(prompt, current_user)
        logger.debug(f"--- Raw Response (Retry) ---\n{raw}\n--------------------")
        try:
            return _parse_json(raw)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Gemini returned unparseable JSON after retry for lead {lead.id}. Raw: {raw}")

def generate_followup(lead, initial_tone: str, followup_tone: str, current_user) -> dict:
    """
    Returns { "subject": str, "body": str }.
    Uses structured outputs when available.
    """
    prompt = build_followup_prompt(lead.name, lead.role, lead.company, initial_tone, followup_tone, current_user.smtp_from_name)
    
    # Try structured output first
    try:
        raw = _call_gemini(prompt, current_user, response_schema=FollowupEmail)
        return _parse_json(raw)
    except (TypeError, google_exceptions.InvalidArgument):
        logger.info("Structured output not supported for followup, falling back")
    
    # Fallback
    raw = _call_gemini(prompt, current_user)
    try:
        return _parse_json(raw)
    except (json.JSONDecodeError, KeyError, ValueError):
        logger.warning(f"Failed to parse JSON for followup lead {lead.id}. Retrying...")
        raw = _call_gemini(prompt, current_user)
        return _parse_json(raw)
