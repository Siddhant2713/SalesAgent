from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), index=True)
    role = Column(String(255))
    company = Column(String(255))
    email = Column(String(255), unique=False, index=True)
    status = Column(String(20), default="new", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), index=True)

    user = relationship("User", back_populates="leads")
    messages = relationship("Message", back_populates="lead", cascade="all, delete-orphan")
