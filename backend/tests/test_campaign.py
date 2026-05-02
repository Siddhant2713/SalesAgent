"""Tests for campaign endpoints — verifies gate checks without needing Gemini API."""


def test_generate_fails_without_gemini_key(client):
    """Campaign generation should fail with 400 if user has no Gemini API key configured."""
    res = client.post(
        "/api/campaign/generate",
        json={"campaign_name": "Test Campaign", "lead_ids": [1]}
    )
    assert res.status_code == 400
    assert "Gemini API Key" in res.json()["detail"]


def test_generate_returns_404_for_invalid_leads(client, db, test_user):
    """Campaign generation should return 404 when lead IDs don't exist."""
    # Give the user a Gemini key so we get past that check
    test_user.gemini_api_key = "AIzaTestKeyForTestingPurposesOnly1234"
    db.commit()
    
    res = client.post(
        "/api/campaign/generate",
        json={"campaign_name": "Test Campaign", "lead_ids": [99999]}
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
