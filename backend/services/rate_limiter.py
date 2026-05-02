"""
rate_limiter.py

Conservative token bucket + daily counter for Gemini free tier.
Hard limits (set BELOW actual Google limits for safety margin):
  - MAX_RPM = 10        (Google allows 15 — we cap at 10, giving 33% headroom)
  - MAX_RPD = 100       (Google allows 1,500 — we cap at 100 for development/testing)
  - INTER_REQUEST_DELAY = 6.0 seconds (ensures <= 10/min even with burst)

In production with higher quota confidence, raise MAX_RPD only.
"""

import time
import threading
from datetime import date
from config import settings

# ── Hard caps ─────────────────────────────────────────────────────────────────
MAX_RPM: int = 10          # Requests per minute ceiling (we enforce, not Google)
MAX_RPD: int = 100         # Daily ceiling. Conservative for testing.
INTER_REQUEST_DELAY: float = 6.0  # Seconds to wait between requests (60s / 10rpm)

class _RateLimiter:
    """Thread-safe token bucket with daily quota counter."""

    def __init__(self):
        self._lock = threading.Lock()
        self._daily_count: int = 0
        self._last_request_time: float = 0.0
        self._quota_date: date = date.today()

    def _reset_if_new_day(self) -> None:
        today = date.today()
        if today != self._quota_date:
            self._daily_count = 0
            self._quota_date = today

    @property
    def daily_usage(self) -> int:
        with self._lock:
            self._reset_if_new_day()
            return self._daily_count

    @property
    def daily_remaining(self) -> int:
        return MAX_RPD - self.daily_usage

    def acquire(self) -> None:
        """
        Block until it is safe to make an API call.
        Raises QuotaExceededError if daily limit is reached.
        """
        with self._lock:
            self._reset_if_new_day()

            # Daily quota check — hard stop
            if self._daily_count >= MAX_RPD:
                raise QuotaExceededError(
                    f"Daily Gemini API quota reached ({MAX_RPD} requests). "
                    f"Resets at midnight. Used today: {self._daily_count}."
                )

            # RPM enforcement — sleep if needed
            elapsed = time.monotonic() - self._last_request_time
            if elapsed < INTER_REQUEST_DELAY:
                time.sleep(INTER_REQUEST_DELAY - elapsed)

            self._last_request_time = time.monotonic()
            self._daily_count += 1

    def status(self) -> dict:
        """Return current quota status for the /api/quota endpoint."""
        with self._lock:
            self._reset_if_new_day()
            return {
                "daily_used": self._daily_count,
                "daily_limit": MAX_RPD,
                "daily_remaining": MAX_RPD - self._daily_count,
                "rpm_limit": MAX_RPM,
                "inter_request_delay_seconds": INTER_REQUEST_DELAY,
                "quota_date": self._quota_date.isoformat(),
            }


class QuotaExceededError(Exception):
    """Raised when the daily Gemini API cap is hit."""
    pass


# Module-level singleton — imported everywhere
gemini_limiter = _RateLimiter()
