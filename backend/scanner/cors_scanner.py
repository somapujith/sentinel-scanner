"""
CORS security scanner. Identifies overly permissive Cross-Origin Resource Sharing policies.
"""

from __future__ import annotations

import httpx
from typing import Any
from urllib.parse import urlparse
from scanner.targets import http_base_urls, ssl_verify

USER_AGENT = "VulnerabilityScanner/1.0 (educational)"
TIMEOUT = 10.0

def run(target: str) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    urls = http_base_urls(target)

    if not urls:
        return findings

    limits = httpx.Limits(max_connections=5)
    verify = ssl_verify()

    with httpx.Client(
        timeout=TIMEOUT,
        follow_redirects=True,
        limits=limits,
        verify=verify,
    ) as client:
        for base in urls:
            try:
                # 1. Test wildcard CORS
                req1 = client.options(
                    base,
                    headers={"User-Agent": USER_AGENT, "Origin": "https://evil.example.com"}
                )
                acao = req1.headers.get("access-control-allow-origin")
                acac = req1.headers.get("access-control-allow-credentials")

                if acao == "*":
                    if acac == "true":
                        findings.append({
                            "type": "cors_wildcard_credentials",
                            "title": "Permissive CORS Policy (Wildcard + Credentials)",
                            "description": "The 'Access-Control-Allow-Origin' header is set to '*' while 'Access-Control-Allow-Credentials' is 'true'. This is highly insecure and violates browser protections, allowing attackers to access authenticated endpoints from any domain.",
                            "affected_component": base,
                            "evidence": "Access-Control-Allow-Origin: * | Access-Control-Allow-Credentials: true"
                        })
                    else:
                        findings.append({
                            "type": "cors_wildcard",
                            "title": "Permissive CORS Policy (Wildcard)",
                            "description": "The 'Access-Control-Allow-Origin' header is set to '*'. Any website can make cross-origin requests to this endpoint. This may be intended for public APIs, but is a risk otherwise.",
                            "affected_component": base,
                            "evidence": "Access-Control-Allow-Origin: *"
                        })
                
                # 2. Test Origin Reflection
                elif acao == "https://evil.example.com":
                    if acac == "true":
                        findings.append({
                            "type": "cors_reflection_credentials",
                            "title": "Insecure CORS Policy (Origin Reflection + Credentials)",
                            "description": "The server reflects arbitrary 'Origin' headers back into the 'Access-Control-Allow-Origin' header while allowing credentials. This allows any attacker site to steal sensitive data unconditionally.",
                            "affected_component": base,
                            "evidence": "Access-Control-Allow-Origin: https://evil.example.com | Access-Control-Allow-Credentials: true"
                        })
                    else:
                        findings.append({
                            "type": "cors_reflection",
                            "title": "Insecure CORS Policy (Origin Reflection)",
                            "description": "The server reflects arbitrary 'Origin' headers back into 'Access-Control-Allow-Origin'. While less dangerous without credentials, it bypasses CORS fundamentally.",
                            "affected_component": base,
                            "evidence": "Access-Control-Allow-Origin: https://evil.example.com"
                        })

                # Only test the first responding base URL to save time and prevent duplicates since
                # usually they redirect or apply globally.
                return findings
                
            except httpx.RequestError:
                continue

    return findings
