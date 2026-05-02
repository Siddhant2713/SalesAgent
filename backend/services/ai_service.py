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

logger = logging.getLogger(__name__)

MODEL = "gemini-2.5-flash"
MAX_TOKENS = 2048
TEMPERATURE = 0.7

client = genai.Client(api_key=settings.gemini_api_key)

def _call_gemini(prompt: str, retries: int = 1) -> str:
    """Call Gemini API with one retry on failure. Returns raw text."""
    for attempt in range(retries + 1):
        try:
            gemini_limiter.acquire()   # <-- ALWAYS called first, every time
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=TEMPERATURE,
                    max_output_tokens=MAX_TOKENS,
                    response_mime_type="application/json",
                )
            )
            return response.text
        except QuotaExceededError:
            raise   # Do NOT retry on quota — it won't help
        except google_exceptions.ResourceExhausted:
            if attempt < retries:
                logger.warning(f"Gemini API rate limit hit. Retrying in 60s...")
                time.sleep(60)  # wait full minute for RPM reset
                continue
            raise
        except Exception as e:
            if attempt < retries:
                logger.warning(f"Gemini API call failed: {e}. Retrying in 2s...")
                time.sleep(2)  # brief pause before retry
                continue
            raise e

def _parse_json(text: str) -> dict:
    """Strip any accidental markdown fences and parse JSON."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    return json.loads(text)

def generate_messages(lead) -> dict:
    """
    Returns dict with keys: friendly, direct, curiosity.
    Each value is { "subject": str, "body": str }.
    Raises ValueError on parse failure after retry.
    Raises Exception on API error.
    """
    prompt = build_initial_prompt(lead.name, lead.role, lead.company)
    logger.info(f"--- Sending Prompt ---\n{prompt}\n----------------------")
    raw = _call_gemini(prompt)
    logger.info(f"--- Raw Response ---\n{raw}\n--------------------")
    try:
        return _parse_json(raw)
    except (json.JSONDecodeError, KeyError):
        logger.warning(f"Failed to parse JSON for lead {lead.id}. Retrying...")
        # Retry once with explicit re-call
        raw = _call_gemini(prompt)
        logger.info(f"--- Raw Response (Retry) ---\n{raw}\n--------------------")
        try:
            return _parse_json(raw)
        except Exception as e:
            raise ValueError(f"Gemini returned unparseable JSON after retry for lead {lead.id}. Raw: {raw}")

def generate_followup(lead, initial_tone: str, followup_tone: str) -> dict:
    """
    Returns { "subject": str, "body": str }.
    """
    prompt = build_followup_prompt(lead.name, lead.role, lead.company, initial_tone, followup_tone)
    raw = _call_gemini(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        logger.warning(f"Failed to parse JSON for followup lead {lead.id}. Retrying...")
        raw = _call_gemini(prompt)
        return _parse_json(raw)
