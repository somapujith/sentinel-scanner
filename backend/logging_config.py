"""Application logging: avoid echoing reflected probe payloads at INFO/DEBUG."""

from __future__ import annotations

import logging
import os

_LOG_LEVEL = os.environ.get("SENTINEL_LOG_LEVEL", "INFO").upper()


def setup_logging() -> None:
    level = getattr(logging, _LOG_LEVEL, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    # Third-party noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def safe_scan_failure_reason(exc: BaseException) -> str:
    """Store a short, non-sensitive status when a scan module fails (no exception text that may echo targets/payloads)."""
    return f"{type(exc).__name__}"
