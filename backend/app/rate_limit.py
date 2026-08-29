# Re-export from core for backwards compatibility
from .core.rate_limit import SlidingWindowLimiter, limiter

__all__ = ["SlidingWindowLimiter", "limiter"]
