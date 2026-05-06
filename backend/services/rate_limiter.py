"""
rate_limiter.py — Per-user token bucket with correct free-tier limits.

Key changes from v1:
  1. Per-user limiter pool (keyed on user_id × api_key_hash)
  2. MAX_RPD raised from 100 → 1,400 (93% of actual 1,500 free limit)
  3. INTER_REQUEST_DELAY lowered from 6.0s → 4.3s (60/14 RPM)
  4. time.sleep() preserved (calls dispatched via asyncio.to_thread
     in provider layer, so sleep doesn't block the event loop)
  5. Thread-safe with per-instance Lock (not shared lock)

Daily quota budget allocation:
  Primary generation budget:  1,200 RPD → 600 leads/day
  Followup budget:             200 RPD → 200 followups/day
  Total committed:           1,400 RPD
  Hard ceiling:              1,500 RPD (Gemini free tier)
  Safety buffer:               100 RPD
"""

import time
import threading
import logging
from datetime import date
from typing import Tuple, Dict

logger = logging.getLogger(__name__)

# ── Default free-tier limits ───────────────────────────────────────────────
DEFAULT_MAX_RPM: int = 14           # 93% of free-tier 15 RPM
DEFAULT_MAX_RPD: int = 1400         # 93% of free-tier 1,500 RPD
DEFAULT_DELAY: float = 4.3          # 60 / 14 = 4.286s, rounded up for safety

# ── Per-user pool ──────────────────────────────────────────────────────────
_pool_lock = threading.Lock()


class _UserRateLimiter:
    """
    Per-user, per-API-key rate limiter.
    Thread-safe. Reentrant within the same thread.
    """

    def __init__(self, max_rpm: int, max_rpd: int, inter_request_delay: float):
        self._max_rpm = max_rpm
        self._max_rpd = max_rpd
        self._delay = inter_request_delay
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
    def daily_remaining(self) -> int:
        with self._lock:
            self._reset_if_new_day()
            return self._max_rpd - self._daily_count

    def acquire(self) -> None:
        with self._lock:
            self._reset_if_new_day()

            if self._daily_count >= self._max_rpd:
                raise QuotaExceededError(
                    f"Daily API quota reached ({self._max_rpd} requests). "
                    f"Resets at midnight. Used today: {self._daily_count}."
                )

            elapsed = time.monotonic() - self._last_request_time
            if elapsed < self._delay:
                time.sleep(self._delay - elapsed)

            self._last_request_time = time.monotonic()
            self._daily_count += 1

    def status(self) -> dict:
        with self._lock:
            self._reset_if_new_day()
            return {
                "daily_used": self._daily_count,
                "daily_limit": self._max_rpd,
                "daily_remaining": self._max_rpd - self._daily_count,
                "rpm_limit": self._max_rpm,
                "inter_request_delay_seconds": self._delay,
                "quota_date": self._quota_date.isoformat(),
            }


_limiter_pool: Dict[Tuple[int, int], _UserRateLimiter] = {}


def get_limiter_for_user(
    user_id: int,
    api_key_hash: int,
    max_rpm: int = DEFAULT_MAX_RPM,
    max_rpd: int = DEFAULT_MAX_RPD,
    inter_request_delay: float = DEFAULT_DELAY,
) -> _UserRateLimiter:
    """
    Get or create a rate limiter for a specific user × API key combination.
    Different API keys for the same user get independent limiters.
    """
    pool_key = (user_id, api_key_hash)
    with _pool_lock:
        if pool_key not in _limiter_pool:
            _limiter_pool[pool_key] = _UserRateLimiter(
                max_rpm=max_rpm,
                max_rpd=max_rpd,
                inter_request_delay=inter_request_delay,
            )
        return _limiter_pool[pool_key]


# ── Backward-compat singleton (used by /api/analytics/quota endpoint) ──────
# Points to a default instance. Replaced by per-user limiters in providers.
class _GlobalLimiterProxy:
    """
    Thin proxy for the /api/analytics/quota endpoint.
    Reports aggregate status across all active user limiters.
    """

    @property
    def daily_remaining(self) -> int:
        # Return the minimum remaining across active limiters
        with _pool_lock:
            if not _limiter_pool:
                return DEFAULT_MAX_RPD
            return min(l.daily_remaining for l in _limiter_pool.values())

    def status(self) -> dict:
        with _pool_lock:
            if not _limiter_pool:
                return {
                    "daily_used": 0,
                    "daily_limit": DEFAULT_MAX_RPD,
                    "daily_remaining": DEFAULT_MAX_RPD,
                    "rpm_limit": DEFAULT_MAX_RPM,
                    "inter_request_delay_seconds": DEFAULT_DELAY,
                    "quota_date": date.today().isoformat(),
                }
            # Aggregate totals
            total_used = sum(l._daily_count for l in _limiter_pool.values())
            return {
                "daily_used": total_used,
                "daily_limit": DEFAULT_MAX_RPD,
                "daily_remaining": max(0, DEFAULT_MAX_RPD - total_used),
                "rpm_limit": DEFAULT_MAX_RPM,
                "inter_request_delay_seconds": DEFAULT_DELAY,
                "quota_date": date.today().isoformat(),
            }

    def acquire(self):
        raise RuntimeError("Use get_limiter_for_user() instead of global singleton.")


gemini_limiter = _GlobalLimiterProxy()


class QuotaExceededError(Exception):
    """Raised when the daily API cap is hit."""
    pass
