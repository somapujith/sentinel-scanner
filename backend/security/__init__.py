"""Security helpers: client IP behind trusted proxies, API key extraction."""

from __future__ import annotations

import hashlib

from fastapi import HTTPException, Request

from config import api_keys, is_trusted_proxy, require_api_key_enabled


def api_key_from_request(request: Request) -> str | None:
    h = (request.headers.get("x-api-key") or "").strip()
    if h:
        return h
    auth = request.headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def client_ip(request: Request) -> str:
    """Use X-Forwarded-For only when the immediate peer is a configured trusted proxy."""
    direct = ""
    if request.client:
        direct = request.client.host or ""
    if not is_trusted_proxy(direct):
        return direct[:64]
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()[:64]
    return direct[:64]


def rate_limit_key(request: Request) -> str:
    """SlowAPI key: hash API key when present, else client IP (after trusted-proxy logic)."""
    k = api_key_from_request(request)
    if k:
        h = hashlib.sha256(k.encode("utf-8")).hexdigest()[:32]
        return f"k:{h}"
    return f"ip:{client_ip(request)}"


def require_api_key(request: Request) -> str | None:
    """Dependency: enforce API key when SENTINEL_REQUIRE_API_KEY is set."""
    if not require_api_key_enabled():
        return None
    provided = api_key_from_request(request)
    valid = api_keys()
    if not provided or provided not in valid:
        raise HTTPException(
            status_code=401,
            detail="Valid API key required (X-API-Key or Authorization: Bearer).",
        )
    return provided


def auth_ok(request: Request) -> bool:
    """True if request may access protected /api routes (used by middleware)."""
    if not require_api_key_enabled():
        return True
    provided = api_key_from_request(request)
    if provided and provided in api_keys():
        return True
    # EventSource cannot attach headers; allow `api_key` query on SSE paths only.
    if request.url.path.rstrip("/").endswith("/events"):
        qk = request.query_params.get("api_key")
        if qk and qk in api_keys():
            return True
    return False
