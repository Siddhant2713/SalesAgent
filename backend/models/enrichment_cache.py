from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class EnrichmentCacheEntry(Base):
    __tablename__ = "enrichment_cache"

    id           = Column(Integer, primary_key=True)
    company_key  = Column(String(255), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    stage        = Column(String(50))
    pain_points  = Column(Text)      # JSON array string
    best_hook    = Column(Text)
    tone         = Column(String(20))
    provider     = Column(String(50), default="gemini")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    expires_at   = Column(DateTime(timezone=True), nullable=False, index=True)
