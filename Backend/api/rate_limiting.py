"""
rate_limiting.py
================
In-memory, thread-safe rate limiter for Relief-Map.

Guard applied to every AI Triage (SOS) request:

  UserRateLimiter
  Sliding-window counter per userId.
  Default: max 3 requests in any 5-minute window.

For multi-process / multi-server deployments, replace with a Redis
backend (e.g. django-ratelimit or django-redis).
"""

import time
import threading
from collections import deque


class UserRateLimiter:
    """
    Allows at most `max_calls` requests per `window_seconds` for a given userId.

    Uses a deque as a sliding window — only timestamps within the window
    are kept, so memory usage stays bounded.
    """

    def __init__(self, max_calls: int = 3, window_seconds: int = 300):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        # user_id -> deque of UNIX timestamps (float)
        self._windows: dict[str, deque] = {}

    def is_allowed(self, user_id: str) -> tuple[bool, int]:
        """
        Returns (allowed: bool, retry_after_seconds: int).
        retry_after_seconds is 0 when allowed is True.
        """
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            if user_id not in self._windows:
                self._windows[user_id] = deque()

            window = self._windows[user_id]

            # Evict timestamps outside the sliding window
            while window and window[0] < cutoff:
                window.popleft()

            if len(window) >= self.max_calls:
                # How long until the oldest call ages out of the window
                retry_after = int(window[0] - cutoff) + 1
                return False, retry_after

            # Permit — record this call
            window.append(now)
            return True, 0


# ---------------------------------------------------------------------------
# Singleton instances (shared across all request-handling threads)
# ---------------------------------------------------------------------------

#: Max 3 SOS submissions per user in any 5-minute window
user_rate_limiter = UserRateLimiter(max_calls=3, window_seconds=300)
