from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="ready", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="campaigns")
    messages = relationship("Message", back_populates="campaign", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    tone = Column(String(20), nullable=False)
    message_type = Column(String(20), nullable=False)
    subject = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    is_selected = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="messages")
    campaign = relationship("Campaign", back_populates="messages")

    __table_args__ = (
        Index("ix_messages_campaign_sent", "campaign_id", "sent", "message_type"),
        Index("ix_messages_lead_campaign", "lead_id", "campaign_id"),
    )


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    id            = Column(Integer, primary_key=True, index=True)
    campaign_id   = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    total_leads   = Column(Integer, nullable=False, default=0)
    processed     = Column(Integer, nullable=False, default=0)
    succeeded     = Column(Integer, nullable=False, default=0)
    failed        = Column(Integer, nullable=False, default=0)
    status        = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    started_at    = Column(DateTime(timezone=True), nullable=True)
    finished_at   = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign", backref="pipeline_jobs")
