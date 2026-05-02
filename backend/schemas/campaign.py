from pydantic import BaseModel, field_validator
from typing import List

class GenerateRequest(BaseModel):
    campaign_name: str
    lead_ids: List[int]

    @field_validator("campaign_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Campaign name cannot be empty")
        if len(v) > 100:
            raise ValueError("Campaign name cannot exceed 100 characters")
        return v

    @field_validator("lead_ids")
    @classmethod
    def leads_not_empty_and_capped(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError("At least one lead must be selected")
        if len(v) > 50:
            raise ValueError("Maximum 50 leads per generation batch")
        return list(set(v))   # deduplicate silently

class SendCampaignRequest(BaseModel):
    tone: str
    
    @field_validator("tone")
    @classmethod
    def valid_tone(cls, v: str) -> str:
        if v not in {"friendly", "direct", "curiosity"}:
            raise ValueError("tone must be friendly, direct, or curiosity")
        return v
