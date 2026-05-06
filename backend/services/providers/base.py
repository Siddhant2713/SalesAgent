"""
base.py — Abstract LLM provider interface.

Every provider (Gemini, OpenAI, Claude, etc.) must implement this
interface. The LLM Router selects and calls providers transparently.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class ProviderConfig:
    """Runtime configuration for a provider instance."""
    provider_name: str          # "gemini" | "openai" | "claude"
    api_key: str                # User's decrypted API key
    model: str                  # e.g. "gemini-2.5-flash", "gpt-4o-mini"
    max_rpm: int                # Requests per minute ceiling
    max_rpd: int                # Requests per day ceiling
    inter_request_delay: float  # Seconds between requests
    temperature_enrich: float = 0.4
    temperature_generate: float = 0.7
    max_tokens_enrich: int = 512
    max_tokens_generate: int = 2048
    max_tokens_followup: int = 512


@dataclass
class EnrichmentResult:
    company_stage: str                  # "early_startup" | "growth_stage" | "enterprise"
    likely_pain_points: List[str]       # 2-3 pain points
    best_hook: str                      # Single most compelling angle
    tone_recommendation: str            # "friendly" | "direct" | "curiosity"
    source_provider: str                # Which provider generated this


@dataclass
class EmailVariantResult:
    subject: str
    body: str


@dataclass
class GenerationResult:
    friendly: EmailVariantResult
    direct: EmailVariantResult
    curiosity: EmailVariantResult
    source_provider: str


@dataclass
class FollowupResult:
    subject: str
    body: str
    source_provider: str


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    def __init__(self, config: ProviderConfig):
        self.config = config

    @abstractmethod
    async def enrich(
        self,
        company: str,
        role: str,
    ) -> Optional[EnrichmentResult]:
        """
        Research a company and return structured enrichment data.
        Returns None if enrichment fails (non-blocking contract).
        """

    @abstractmethod
    async def generate(
        self,
        lead_name: str,
        lead_role: str,
        lead_company: str,
        sender_name: str,
        enrichment: Optional[EnrichmentResult],
    ) -> GenerationResult:
        """
        Generate 3 email variants (friendly, direct, curiosity).
        Raises ValueError on unrecoverable parse failure.
        """

    @abstractmethod
    async def followup(
        self,
        lead_name: str,
        lead_role: str,
        lead_company: str,
        sender_name: str,
        initial_tone: str,
        followup_tone: str,
    ) -> FollowupResult:
        """
        Generate a single follow-up email.
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique identifier string for this provider."""
