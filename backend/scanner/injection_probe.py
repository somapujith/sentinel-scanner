"""
Reflected input checks: GET with probe query parameters; detects verbatim echo in body.
Authorized testing only.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse, urlunparse

import httpx

from scanner.targets import http_base_urls, ssl_verify

USER_AGENT = "VulnerabilityScanner/1.0 (educational; +https://owasp.org)"
TIMEOUT = 15.0

XSS_PROBE = "<script>alert(1)</script>"
SQLI_PROBE = "' OR '1'='1"


def _strip_query(url: str) -> str:
    p = urlparse(url)
    return urlunparse((p.scheme, p.netloc, p.path or "/", "", "", ""))


def run(target: str) -> list[dict[str, Any]]:
    bases = http_base_urls(target)
    if not bases:
        return [
            {
                "type": "injection_probe_unreachable",
                "title": "Invalid target for injection probes",
                "description": "Provide a URL or host so the scanner can issue GET requests.",
                "affected_component": target,
                "evidence": "no URL could be built",
            }
        ]

    verify = ssl_verify()
    findings: list[dict[str, Any]] = []

    with httpx.Client(
        timeout=TIMEOUT,
        verify=verify,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT},
        limits=httpx.Limits(max_connections=10),
    ) as client:
        scan_base: str | None = None
        for base in bases:
            try:
                r0 = client.get(base, timeout=TIMEOUT)
                if r0.status_code < 500:
                    scan_base = _strip_query(str(r0.url).split("#")[0])
                    break
            except httpx.RequestError:
                continue

        if not scan_base:
            return [
                {
                    "type": "injection_probe_unreachable",
                    "title": "Could not reach target for injection probes",
                    "description": "HTTPS/HTTP GET failed — no reflection test was performed.",
                    "affected_component": target,
                    "evidence": "connection error on all candidate URLs",
                }
            ]

        try:
            r_xss = client.get(scan_base, params={"vscan_xss_probe": XSS_PROBE}, timeout=TIMEOUT)
            body = r_xss.text or ""
            if r_xss.status_code < 400 and XSS_PROBE in body:
                findings.append(
                    {
                        "type": "xss_reflected",
                        "title": "Possible reflected XSS (probe echoed)",
                        "description": "The XSS test string appeared in the response body. Confirm manually; context matters for exploitability.",
                        "affected_component": str(r_xss.url),
                        "evidence": "GET parameter vscan_xss_probe echoed verbatim",
                    }
                )
        except httpx.RequestError as e:
            findings.append(
                {
                    "type": "injection_probe_error",
                    "title": "XSS reflection probe failed",
                    "description": str(e),
                    "affected_component": scan_base,
                    "evidence": "httpx error",
                }
            )

        try:
            r_sq = client.get(scan_base, params={"vscan_sqli_probe": SQLI_PROBE}, timeout=TIMEOUT)
            body = r_sq.text or ""
            if r_sq.status_code < 400 and SQLI_PROBE in body:
                findings.append(
                    {
                        "type": "sql_injection",
                        "title": "Possible SQL injection reflection (probe echoed)",
                        "description": "The SQLi test string appeared in the response. Not proof of injection — verify with controlled testing.",
                        "affected_component": str(r_sq.url),
                        "evidence": "GET parameter vscan_sqli_probe echoed verbatim",
                    }
                )
        except httpx.RequestError as e:
            findings.append(
                {
                    "type": "injection_probe_error",
                    "title": "SQLi reflection probe failed",
                    "description": str(e),
                    "affected_component": scan_base,
                    "evidence": "httpx error",
                }
            )

        try:
            r_redirect = client.get(
                scan_base, 
                params={"redirect": "http://evil.example.com", "url": "http://evil.example.com", "next": "http://evil.example.com"}, 
                timeout=TIMEOUT, 
                follow_redirects=False
            )
            loc = r_redirect.headers.get("location", "")
            if r_redirect.status_code in (301, 302, 303, 307, 308) and "evil.example.com" in loc:
                findings.append(
                    {
                        "type": "open_redirect",
                        "title": "Open Redirect Vulnerability",
                        "description": "The application redirects users to an arbitrary external URL passed in via query parameters. This can be abused for phishing attacks.",
                        "affected_component": str(r_redirect.url),
                        "evidence": f"Redirected to {loc}",
                    }
                )
        except httpx.RequestError:
            pass

    return findings
