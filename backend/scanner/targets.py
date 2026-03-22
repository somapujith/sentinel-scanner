"""Shared host parsing and TLS verify settings for all scanners."""

from __future__ import annotations

import os
import re
from urllib.parse import urlparse

import certifi


def ssl_verify() -> bool | str:
    """Certifi bundle, or False if SCANNER_SSL_VERIFY=0 (lab only)."""
    flag = os.environ.get("SCANNER_SSL_VERIFY", "1").strip().lower()
    if flag in ("0", "false", "no"):
        return False
    return certifi.where()


def host_from_target(target: str) -> str | None:
    """Resolve hostname or IP from URL, host:port, or bare host/IP."""
    t = (target or "").strip()
    if not t:
        return None
    if re.match(r"^https?://", t, re.I):
        p = urlparse(t)
        return p.hostname
    if "://" not in t:
        p = urlparse(f"//{t}")
        if p.hostname:
            return p.hostname
    return t.split(":")[0].strip() or None


def port_from_target(target: str, default: int = 443) -> int:
    t = (target or "").strip()
    if re.match(r"^https?://", t, re.I):
        p = urlparse(t)
        return p.port or default
    if "://" not in t:
        p = urlparse(f"//{t}")
        if p.port:
            return p.port
    if ":" in t:
        parts = t.rsplit(":", 1)
        if parts[-1].isdigit():
            return int(parts[-1])
    return default


def http_base_urls(target: str) -> list[str]:
    """URLs to try for HTTP(S) probes."""
    t = (target or "").strip()
    if not t:
        return []
    if re.match(r"^https?://", t, re.I):
        return [t]
    return [f"https://{t}", f"http://{t}"]
