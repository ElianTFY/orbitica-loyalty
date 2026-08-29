from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, status


class SlidingWindowLimiter:
    def __init__(self, max_keys: int = 20_000) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()
        self._max_keys = max_keys
        self._last_prune = 0.0

    def _prune(self, now: float) -> None:
        if now - self._last_prune < 60 and len(self._events) < self._max_keys:
            return
        stale_before = now - 3600
        for key in list(self._events.keys()):
            q = self._events[key]
            if not q or q[-1] < stale_before:
                self._events.pop(key, None)
        while len(self._events) >= self._max_keys:
            self._events.pop(next(iter(self._events)), None)
        self._last_prune = now

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        with self._lock:
            self._prune(now)
            q = self._events[key]
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                retry_after = max(1, int(window_seconds - (now - q[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos. Intent? nuevamente m?s tarde.",
                    headers={"Retry-After": str(retry_after)},
                )
            q.append(now)


limiter = SlidingWindowLimiter()
