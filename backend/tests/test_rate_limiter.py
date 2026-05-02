import pytest
from services import rate_limiter
from services.rate_limiter import _RateLimiter, QuotaExceededError

def test_daily_quota_enforced():
    # Store original values
    orig_rpd = rate_limiter.MAX_RPD
    orig_delay = rate_limiter.INTER_REQUEST_DELAY
    
    # Mock globals for instantaneous testing
    rate_limiter.MAX_RPD = 3
    rate_limiter.INTER_REQUEST_DELAY = 0.0
    
    try:
        limiter = _RateLimiter()
        limiter.acquire()
        limiter.acquire()
        limiter.acquire()
        with pytest.raises(QuotaExceededError):
            limiter.acquire()
    finally:
        # Restore globals
        rate_limiter.MAX_RPD = orig_rpd
        rate_limiter.INTER_REQUEST_DELAY = orig_delay

def test_status_returns_correct_structure():
    limiter = _RateLimiter()
    status = limiter.status()
    assert "daily_used" in status
    assert "daily_remaining" in status
    assert "quota_date" in status
