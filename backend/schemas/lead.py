from pydantic import BaseModel, EmailStr, field_validator
import re

class LeadCreate(BaseModel):
    name: str
    role: str
    company: str
    email: EmailStr   # Pydantic validates email format automatically

    @field_validator("name", "role", "company")
    @classmethod
    def strip_and_limit(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Field cannot be empty")
        if len(v) > 255:
            raise ValueError("Field cannot exceed 255 characters")
        return v

class LeadResponse(BaseModel):
    id: int
    name: str
    role: str
    company: str
    email: str
    status: str
    
    model_config = {"from_attributes": True}

class LeadStatusUpdate(BaseModel):
    status: str
    
    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = {"new", "contacted", "replied"}
        if v not in valid:
            raise ValueError(f"status must be one of {valid}")
        return v
