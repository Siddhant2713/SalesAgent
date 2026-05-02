"""Tests for Google Sheets import endpoint."""


def test_sheets_import_rejects_invalid_url(client):
    """Should reject a non-Google-Sheets URL."""
    response = client.post(
        "/api/leads/import/sheets",
        json={"sheet_url": "https://example.com/not-a-sheet"}
    )
    assert response.status_code == 400
    assert "Invalid Google Sheets URL" in response.json()["detail"]


def test_sheets_import_rejects_empty_url(client):
    """Should reject an empty sheet_url field."""
    response = client.post(
        "/api/leads/import/sheets",
        json={"sheet_url": ""}
    )
    # Empty URL should fail validation or in the service
    assert response.status_code in (400, 422)
