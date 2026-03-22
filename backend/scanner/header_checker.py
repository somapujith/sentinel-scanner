"""
HTTP security header analysis using httpx.
Respects robots.txt: if access is disallowed for our user-agent, we skip the main fetch.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx

from scanner.targets import http_base_urls, ssl_verify

USER_AGENT = "VulnerabilityScanner/1.0 (educational; +https://owasp.org)"
TIMEOUT = 15.0


def _robots_url(base: str) -> str:
    p = urlparse(base)
    origin = f"{p.scheme}://{p.netloc}"
    return urljoin(origin + "/", "robots.txt")


def _robots_disallows_all(robots_body: str) -> bool:
    """True if User-agent: * has Disallow: / (full-site disallow for all crawlers)."""
    current_agent: str | None = None
    for raw in robots_body.splitlines():
        ln = raw.strip()
        if not ln or ln.startswith("#"):
            continue
        low = ln.lower()
        if low.startswith("user-agent:"):
            current_agent = ln.split(":", 1)[1].strip()
            continue
        if current_agent == "*" and low.startswith("disallow:"):
            path = ln.split(":", 1)[1].strip()
            if path == "/":
                return True
    return False


def _robots_allows_scan(client: httpx.Client, base_url: str) -> tuple[bool, str | None]:
    """Returns (allowed, robots_body_or_none)."""
    ru = _robots_url(base_url)
    try:
        r = client.get(ru, timeout=TIMEOUT)
    except httpx.RequestError:
        return True, None
    if r.status_code == 404:
        return True, None
    if r.status_code != 200:
        return True, None
    body = r.text
    if _robots_disallows_all(body):
        return False, body
    return True, body


def _csp_has_frame_ancestors(csp: str) -> bool:
    if not csp:
        return False
    return bool(re.search(r"frame-ancestors\s+[^;]+", csp, re.I))


def _analyze_headers(final_url: str, headers: httpx.Headers) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    # httpx.Headers can contain multiple identical headers (e.g., Set-Cookie)
    h_multi = list(headers.multi_items())
    h = dict(headers.items())  # simpler lookup for single-headers, lowercase keys
    
    parsed = urlparse(final_url)
    is_https = parsed.scheme == "https"

    csp = h.get("content-security-policy", "").strip()
    if not csp:
        findings.append(
            {
                "type": "missing_csp",
                "title": "Missing Content-Security-Policy",
                "description": "No CSP header was returned. CSP reduces XSS impact by restricting script and resource loads.",
                "affected_component": final_url,
                "evidence": "Header Content-Security-Policy absent",
            }
        )

    if is_https:
        hsts = h.get("strict-transport-security", "").strip()
        if not hsts:
            findings.append(
                {
                    "type": "missing_hsts",
                    "title": "Missing Strict-Transport-Security",
                    "description": "HTTPS responses should send HSTS so browsers avoid protocol downgrade and cookie stripping.",
                    "affected_component": final_url,
                    "evidence": "Header Strict-Transport-Security absent on HTTPS response",
                }
            )
    else:
        findings.append(
            {
                "type": "served_over_http",
                "title": "Site served over HTTP (no TLS)",
                "description": "Responses are not protected by TLS in transit — credentials and sessions can be intercepted or modified.",
                "affected_component": final_url,
                "evidence": f"Final URL scheme: {parsed.scheme}",
            }
        )

    xfo = h.get("x-frame-options", "").strip()
    if not xfo and not _csp_has_frame_ancestors(csp):
        findings.append(
            {
                "type": "missing_xframe",
                "title": "Missing clickjacking protections",
                "description": "Neither X-Frame-Options nor CSP frame-ancestors was present to control embedding in frames.",
                "affected_component": final_url,
                "evidence": "X-Frame-Options absent; CSP has no frame-ancestors",
            }
        )

    xcto = h.get("x-content-type-options", "").lower()
    if "nosniff" not in xcto:
        findings.append(
            {
                "type": "missing_xcontent_type",
                "title": "Missing X-Content-Type-Options: nosniff",
                "description": "Without nosniff, browsers may MIME-sniff responses, increasing risk of content confusion attacks.",
                "affected_component": final_url,
                "evidence": h.get("x-content-type-options") or "header absent",
            }
        )
        
    # Cookie Security Checks
    for key, value in h_multi:
        if key.lower() == "set-cookie":
            parts = [p.strip().lower() for p in value.split(";")]
            secure = "secure" in parts
            httponly = "httponly" in parts
            samesite = any(p.startswith("samesite=") for p in parts)
            
            issues = []
            if not secure and is_https:
                issues.append("missing Secure flag")
            if not httponly:
                issues.append("missing HttpOnly flag")
            if not samesite:
                issues.append("missing SameSite attribute")
                
            if issues:
                findings.append(
                    {
                        "type": "insecure_cookie",
                        "title": "Insecure Cookie Settings",
                        "description": "Cookies were set without recommended security flags, exposing them to theft (XSS/MitM) or CSRF.",
                        "affected_component": final_url,
                        "evidence": f"Cookie: {value.split(';')[0]} | Issues: {', '.join(issues)}",
                    }
                )

    # Technology Fingerprinting
    server_hdr = h.get("server", "")
    if server_hdr:
        findings.append(
            {
                "type": "technology_fingerprint",
                "title": "Technology Fingerprinting (Server)",
                "description": "The 'Server' header is disclosing specific technology stacks, which helps attackers target exploits.",
                "affected_component": final_url,
                "evidence": f"Server: {server_hdr}",
            }
        )
        
    x_powered = h.get("x-powered-by", "")
    if x_powered:
        findings.append(
            {
                "type": "technology_fingerprint",
                "title": "Technology Fingerprinting (X-Powered-By)",
                "description": "The 'X-Powered-By' header is exposing the underlying framework (e.g. PHP, Express).",
                "affected_component": final_url,
                "evidence": f"X-Powered-By: {x_powered}",
            }
        )

    # WAF Detection
    waf_signatures = ["cloudflare", "incapsula", "x-amzn-waf", "x-sucuri", "imperva"]
    waf_found = False
    for k, v in h_multi:
        if any(w in k.lower() or w in v.lower() for w in waf_signatures):
            waf_found = True
            break
            
    if waf_found:
        findings.append(
            {
                "type": "info_waf_detected",
                "title": "Web Application Firewall (WAF) Detected",
                "description": "A WAF was detected protecting the application. Some exploit payloads may be blocked.",
                "affected_component": final_url,
                "evidence": "Observed WAF-specific headers or tokens in the response.",
            }
        )

    return findings


def run(target: str) -> list[dict[str, Any]]:
    urls = http_base_urls(target)
    if not urls:
        return [
            {
                "type": "http_fetch_failed",
                "title": "Invalid target",
                "description": "Provide a URL (http/https) or host/IP.",
                "affected_component": target,
                "evidence": "empty target",
            }
        ]

    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    verify = ssl_verify()
    with httpx.Client(
        timeout=TIMEOUT,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT},
        limits=limits,
        verify=verify,
    ) as client:
        last_error: str | None = None
        for base in urls:
            try:
                allowed, _ = _robots_allows_scan(client, base)
                if not allowed:
                    return [
                        {
                            "type": "robots_disallow",
                            "title": "robots.txt disallows automated access",
                            "description": "This scanner respects robots.txt and did not fetch the page body.",
                            "affected_component": _robots_url(base),
                            "evidence": "User-agent: * / Disallow: / (or equivalent full disallow)",
                        }
                    ]

                r = client.get(base)
                final_url = str(r.url)
                if r.status_code >= 400:
                    last_error = f"HTTP {r.status_code}"
                    continue
                return _analyze_headers(final_url, r.headers)
            except httpx.RequestError as e:
                last_error = str(e.__class__.__name__) + ": " + str(e)
                continue

    return [
        {
            "type": "http_fetch_failed",
            "title": "Could not retrieve HTTP response",
            "description": "Tried HTTPS then HTTP where applicable. Check the target, firewall, or TLS configuration.",
            "affected_component": target,
            "evidence": last_error or "unknown error",
        }
    ]
