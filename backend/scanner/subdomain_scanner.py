"""
Subdomain enumeration scanner. Checks for the existence of common subdomains (api, admin, dev, etc.)
"""

from __future__ import annotations

import concurrent.futures
from typing import Any
from urllib.parse import urlparse
import dns.resolver

COMMON_SUBDOMAINS = [
    "admin", "api", "blog", "cpanel", "dashboard", "db", "dev", "ftp",
    "git", "mail", "portal", "secure", "stage", "staging", "test", "webmail"
]

def _extract_domain(target: str) -> str:
    target = target.strip()
    if target.startswith("http://") or target.startswith("https://"):
        return urlparse(target).hostname or target
    return target.split("/")[0].split(":")[0]

def _check_subdomain(subdomain: str, domain: str, resolver: dns.resolver.Resolver) -> str | None:
    full_domain = f"{subdomain}.{domain}"
    try:
        resolver.resolve(full_domain, 'A')
        return full_domain
    except Exception:
        return None

def run(target: str) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    domain = _extract_domain(target)

    # Validate domain 
    if not domain or domain.replace(".", "").isnumeric() or domain in ("localhost", "127.0.0.1"):
        return findings

    # Skip if wildcard domain is enabled
    resolver = dns.resolver.Resolver()
    resolver.timeout = 2.0
    resolver.lifetime = 2.0
    
    try:
        # Check wildcard (if a random domain resolves, they all resolve, so bypass enum)
        resolver.resolve(f"this-should-not-exist-random-string.{domain}", 'A')
        # If no exception, wildcard is caught. Exit early to avoid false positive floods.
        return findings
    except Exception:
        pass

    found = []
    # Fast parallel DNS enum using threads since DNS lookup is I/O-bound
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(_check_subdomain, sub, domain, resolver) for sub in COMMON_SUBDOMAINS]
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res:
                found.append(res)
    
    if found:
        findings.append({
            "type": "subdomains_enumerated",
            "title": "Subdomains Enumerated via Brute-Force",
            "description": "Common subdomains were found resolving to an IP address. Exposed internal/administrative panels or development instances increase the attack surface.",
            "affected_component": f"DNS target: {domain}",
            "evidence": ", ".join(found)
        })

    return findings
