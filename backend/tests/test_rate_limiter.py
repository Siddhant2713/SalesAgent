import pytest
from services import rate_limiter as rl
from services.rate_limiter import _UserRateLimiter, QuotaExceededError

def test_daily_quota_enforced():
    limiter = _UserRateLimiter(max_rpm=10, max_rpd=3, inter_request_delay=0.0)
    limiter.acquire()
    limiter.acquire()
    limiter.acquire()
    with pytest.raises(QuotaExceededError):
        limiter.acquire()

def test_status_returns_correct_structure():
    limiter = _UserRateLimiter(max_rpm=14, max_rpd=1400, inter_request_delay=4.3)
    status = limiter.status()
    assert "daily_used" in status
    assert "daily_remaining" in status
    assert "quota_date" in status
    assert status["daily_limit"] == 1400
    assert status["rpm_limit"] == 14

def test_per_user_isolation():
    """Two users with different keys get independent limiters."""
    from services.rate_limiter import get_limiter_for_user
    limiter_a = get_limiter_for_user(user_id=1, api_key_hash=111, max_rpd=3, inter_request_delay=0.0)
    limiter_b = get_limiter_for_user(user_id=2, api_key_hash=222, max_rpd=3, inter_request_delay=0.0)
    limiter_a.acquire()
    limiter_a.acquire()
    limiter_a.acquire()
    # User B's limiter should be unaffected
    limiter_b.acquire()  # Should not raise
