"""
Pydantic schemas used as Gemini structured output definitions.
These schemas guarantee that Gemini returns correctly formatted JSON
by enforcing the schema at the API level (response_schema parameter).
"""

from pydantic import BaseModel, Field


class EmailVariant(BaseModel):
    """A single email variant with subject and body."""
    subject: str = Field(description="A compelling email subject line, under 80 chars")
    body: str = Field(description="Email body, under 100 words, no placeholders")


class InitialEmailSet(BaseModel):
    """The three tone variants for an initial cold outreach email."""
    friendly: EmailVariant = Field(description="Warm, conversational tone")
    direct: EmailVariant = Field(description="Straight to value, no fluff")
    curiosity: EmailVariant = Field(description="Opens with an intriguing question")


class FollowupEmail(BaseModel):
    """A single follow-up email."""
    subject: str = Field(description="Follow-up subject line")
    body: str = Field(description="Follow-up body, under 60 words")
