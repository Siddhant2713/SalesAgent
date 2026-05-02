from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # User-specific configurations
    gemini_api_key = Column(String, nullable=True)
    smtp_host = Column(String, nullable=True, default="smtp.gmail.com")
    smtp_port = Column(Integer, nullable=True, default=587)
    smtp_username = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    smtp_from_name = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)

    leads = relationship("Lead", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
