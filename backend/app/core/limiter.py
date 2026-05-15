"""Shared rate limiter instance — import this in routes to avoid circular imports."""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Allow tests (and CI) to disable rate limiting via env var so that fixtures
# that call auth endpoints many times in quick succession are not throttled.
_enabled = os.environ.get("RATELIMIT_ENABLED", "1") not in ("0", "false", "False")

limiter = Limiter(key_func=get_remote_address, enabled=_enabled)
