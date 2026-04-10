"""Environment-driven settings. Secrets must only come from env / secret stores — never from code."""

from __future__ import annotations

import os
from functools import lru_cache

import ipaddress


def _split_csv(val: str) -> list[str]:
    return [x.strip() for x in val.split(",") if x.strip()]


@lru_cache
def cors_origins() -> list[str]:
    raw = os.environ.get(
        "SENTINEL_CORS_ORIGINS",
        "http://localhost:5178,http://127.0.0.1:5178,http://frontend:5178,https://sentinel-scanner.vercel.app",
    )
    return _split_csv(raw)


@lru_cache
def trusted_proxy_networks() -> list:
    """If empty, X-Forwarded-For is never trusted (only the direct peer IP is used)."""
    raw = os.environ.get("SENTINEL_TRUSTED_PROXY_IPS", "").strip()
    if not raw:
        return []
    out = []
    for part in _split_csv(raw):
        try:
            if "/" in part:
                out.append(ipaddress.ip_network(part, strict=False))
            else:
                addr = ipaddress.ip_address(part)
                if addr.version == 4:
                    out.append(ipaddress.ip_network(f"{part}/32"))
                else:
                    out.append(ipaddress.ip_network(f"{part}/128"))
        except ValueError:
            continue
    return out


def is_trusted_proxy(peer_ip: str) -> bool:
    nets = trusted_proxy_networks()
    if not nets or not peer_ip:
        return False
    try:
        addr = ipaddress.ip_address(peer_ip.split("%")[0])
    except ValueError:
        return False
    return any(addr in net for net in nets)


def require_api_key_enabled() -> bool:
    return os.environ.get("SENTINEL_REQUIRE_API_KEY", "").strip().lower() in ("1", "true", "yes", "on")


@lru_cache
def api_keys() -> set[str]:
    raw = os.environ.get("SENTINEL_API_KEYS", "").strip()
    if not raw:
        return set()
    return set(_split_csv(raw))


def validate_auth_config() -> None:
    if require_api_key_enabled() and not api_keys():
        raise RuntimeError(
            "SENTINEL_REQUIRE_API_KEY is set but SENTINEL_API_KEYS is empty. "
            "Set one or more keys in the environment.",
        )


def retention_days() -> int:
    try:
        d = int(os.environ.get("SENTINEL_RETENTION_DAYS", "0"))
    except ValueError:
        return 0
    return max(0, d)


def rate_limit_string() -> str:
    return os.environ.get("SENTINEL_RATE_LIMIT", "30/minute")
