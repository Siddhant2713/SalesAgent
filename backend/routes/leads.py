import csv
import io
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models.lead import Lead
from models.campaign import Message
from schemas.lead import LeadCreate, LeadResponse, LeadStatusUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024  # 1 MB
MAX_ROWS = 500

@router.post("/upload")
async def upload_leads(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 1MB limit")

    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is empty or missing headers")
        
    headers = [h.strip().lower() for h in reader.fieldnames]
    required = {"name", "role", "company", "email"}
    if not required.issubset(set(headers)):
        raise HTTPException(status_code=400, detail=f"CSV headers must include exactly: name, role, company, email")

    inserted = 0
    skipped_duplicates = 0
    skipped_invalid = 0
    created_leads = []

    for i, row in enumerate(reader):
        if i >= MAX_ROWS:
            break
            
        # Extract fields matching lowercased headers
        row_data = {k.strip().lower(): v for k, v in row.items() if k}
        name = row_data.get("name", "").strip()
        role = row_data.get("role", "").strip()
        company = row_data.get("company", "").strip()
        email = row_data.get("email", "").strip()
        
        if not all([name, role, company, email]):
            skipped_invalid += 1
            continue
            
        # Try validating via pydantic LeadCreate
        try:
            lead_in = LeadCreate(name=name, role=role, company=company, email=email)
        except ValueError:
            skipped_invalid += 1
            continue

        # Check existing
        existing = db.query(Lead).filter(Lead.email == lead_in.email).first()
        if existing:
            skipped_duplicates += 1
            continue
            
        new_lead = Lead(
            name=lead_in.name,
            role=lead_in.role,
            company=lead_in.company,
            email=lead_in.email,
            status="new"
        )
        db.add(new_lead)
        created_leads.append(new_lead)
        inserted += 1

    if len(created_leads) == 0 and skipped_duplicates == 0 and skipped_invalid == 0:
        raise HTTPException(status_code=422, detail="No valid rows found")

    db.commit()
    for lead in created_leads:
        db.refresh(lead)

    return {
        "inserted": inserted,
        "skipped_duplicates": skipped_duplicates,
        "skipped_invalid": skipped_invalid,
        "leads": [LeadResponse.model_validate(l).model_dump() for l in created_leads]
    }

@router.post("/manual", response_model=LeadResponse, status_code=201)
def add_lead_manual(lead_in: LeadCreate, db: Session = Depends(get_db)):
    existing = db.query(Lead).filter(Lead.email == lead_in.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
        
    new_lead = Lead(
        name=lead_in.name,
        role=lead_in.role,
        company=lead_in.company,
        email=lead_in.email,
        status="new"
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@router.get("", response_model=dict)
def get_leads(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
        
    total = query.count()
    leads = query.order_by(Lead.id.desc()).offset(skip).limit(min(limit, 500)).all()
    
    return {
        "total": total,
        "leads": [LeadResponse.model_validate(l).model_dump() for l in leads]
    }

@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(lead_id: int, payload: LeadStatusUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    lead.status = payload.status
    db.commit()
    db.refresh(lead)
    return lead

@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # Delete associated messages
    db.query(Message).filter(Message.lead_id == lead.id).delete()
    db.delete(lead)
    db.commit()
    return None
