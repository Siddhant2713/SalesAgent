"""Tests for analytics endpoint — verifies data structure and zero-state correctness."""


def test_analytics_zero_state(client):
    """With no campaigns or messages, analytics should return zeroed-out data."""
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_leads"] == 0
    assert data["emails_sent"] == 0
    assert data["replies"] == 0
    assert data["reply_rate"] == 0.0


def test_analytics_response_structure(client):
    """Analytics response must contain all required keys for the dashboard."""
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    
    required_keys = {"total_leads", "emails_sent", "replies", "reply_rate", "best_tone", "tone_stats"}
    assert required_keys.issubset(set(data.keys()))
    
    # tone_stats must have all 3 tones
    assert "friendly" in data["tone_stats"]
    assert "direct" in data["tone_stats"]
    assert "curiosity" in data["tone_stats"]
    
    # Each tone must have sent, replies, reply_rate
    for tone in ["friendly", "direct", "curiosity"]:
        tone_data = data["tone_stats"][tone]
        assert "sent" in tone_data
        assert "replies" in tone_data
        assert "reply_rate" in tone_data
