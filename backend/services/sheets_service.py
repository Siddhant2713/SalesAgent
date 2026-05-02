"""
sheets_service.py

Import leads from a public Google Sheets URL.
The sheet must be publicly shared ("Anyone with the link can view").

Uses Google's CSV export endpoint — no OAuth, no service account, no gspread needed.
Simply downloads the sheet as CSV via:
  https://docs.google.com/spreadsheets/d/{ID}/export?format=csv

Expected columns (case-insensitive): name, role, company, email
"""

import csv
import io
import re
import logging
from typing import List, Dict

import httpx

logger = logging.getLogger(__name__)

# Regex to extract spreadsheet ID from various Google Sheets URL formats
SHEET_ID_PATTERN = re.compile(
    r"/spreadsheets/d/([a-zA-Z0-9_-]+)"
)


def _extract_sheet_id(url: str) -> str:
    """Extract the Google Sheets spreadsheet ID from a URL."""
    match = SHEET_ID_PATTERN.search(url)
    if not match:
        raise ValueError(
            "Invalid Google Sheets URL. "
            "Expected format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/..."
        )
    return match.group(1)


def fetch_leads_from_sheet(url: str, max_rows: int = 500) -> List[Dict[str, str]]:
    """
    Fetch leads from a publicly shared Google Sheets URL.
    
    Downloads the sheet as CSV using Google's public export endpoint.
    No authentication required — sheet must be publicly accessible.
    
    Returns a list of dicts with keys: name, role, company, email.
    Skips rows with missing required fields.
    
    Raises:
        ValueError: If URL format is invalid or sheet is not accessible
    """
    sheet_id = _extract_sheet_id(url)
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    
    logger.info(f"Fetching Google Sheet {sheet_id} via CSV export...")
    
    try:
        response = httpx.get(export_url, follow_redirects=True, timeout=30.0)
    except httpx.RequestError as e:
        logger.error(f"Network error fetching Google Sheet: {e}")
        raise ValueError(f"Could not connect to Google Sheets: {str(e)}")
    
    if response.status_code == 404:
        raise ValueError("Google Sheet not found. Check the URL and make sure it exists.")
    
    if response.status_code != 200:
        # Google returns an HTML page if the sheet is private
        if "html" in response.headers.get("content-type", "").lower():
            raise ValueError(
                "Cannot access this Google Sheet. Make sure it is shared as "
                "'Anyone with the link can view'."
            )
        raise ValueError(f"Google Sheets returned HTTP {response.status_code}")
    
    # Parse the CSV content
    text = response.text
    reader = csv.DictReader(io.StringIO(text))
    
    if not reader.fieldnames:
        raise ValueError("Google Sheet appears to be empty or has no headers.")
    
    # Normalize headers
    headers = [h.strip().lower() for h in reader.fieldnames]
    required = {"name", "role", "company", "email"}
    if not required.issubset(set(headers)):
        missing = required - set(headers)
        raise ValueError(
            f"Google Sheet is missing required columns: {', '.join(missing)}. "
            f"Found columns: {', '.join(reader.fieldnames)}"
        )
    
    leads = []
    for i, row in enumerate(reader):
        if i >= max_rows:
            break
        
        # Normalize keys to lowercase
        normalized = {k.strip().lower(): str(v).strip() for k, v in row.items()}
        
        name = normalized.get("name", "")
        role = normalized.get("role", "")
        company = normalized.get("company", "")
        email = normalized.get("email", "")
        
        # Skip rows with missing required fields
        if not all([name, role, company, email]):
            continue
        
        leads.append({
            "name": name,
            "role": role,
            "company": company,
            "email": email
        })
    
    logger.info(f"Fetched {len(leads)} valid leads from Google Sheet {sheet_id}")
    return leads
