"""
llm_router.py — Provider selection and fallback routing.

Current state: Only Gemini is supported.
Future state: Add OpenAI/Claude adapters and routing policies.

Routing policies (not yet active, stubs for future):
  - quota_first:   Use provider with most remaining RPD
  - cost_first:    Route to cheapest provider for task type
  - latency_first: Route to fastest responding provider
"""

import logging
from typing import Optional

from .providers.base import BaseLLMProvider, ProviderConfig
from .providers.gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)

# Default Gemini free-tier config
GEMINI_FREE_DEFAULTS = ProviderConfig(
    provider_name="gemini",
    api_key="",                  # Filled at runtime from user settings
    model="gemini-2.0-flash",
    max_rpm=6,                   # Safe MVP limit
    max_rpd=300,                 # Safe MVP limit
    inter_request_delay=10.0,    # 10s delay between requests
    temperature_enrich=0.4,
    temperature_generate=0.7,
    max_tokens_enrich=512,
    max_tokens_generate=2048,
    max_tokens_followup=512,
)


def build_provider(user, user_id: int) -> BaseLLMProvider:
    """
    Build the appropriate provider for a user based on their configured API keys.
    
    Priority order (future):
      1. User's Gemini key       → GeminiProvider
      2. User's OpenAI key       → OpenAIProvider  (not yet implemented)
      3. User's Claude key       → ClaudeProvider  (not yet implemented)
      4. Server-level fallback   → GeminiProvider with server key
    
    Currently: Always returns GeminiProvider.
    """
    from utils.encryption import decrypt

    api_key = decrypt(user.gemini_api_key) if user.gemini_api_key else ""
    if not api_key:
        raise ValueError("No LLM API key configured. Add a Gemini API key in Settings.")

    config = ProviderConfig(
        **{**vars(GEMINI_FREE_DEFAULTS), "api_key": api_key}
    )
    return GeminiProvider(config=config, user_id=user_id)
