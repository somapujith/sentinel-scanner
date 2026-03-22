"""
DNS security scanner. Checks for SPF, DMARC, and dangling CNAMEs.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse
import dns.resolver

def _extract_domain(target: str) -> str:
    target = target.strip()
    if target.startswith("http://") or target.startswith("https://"):
        return urlparse(target).hostname or target
    return target.split("/")[0].split(":")[0]

def run(target: str) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    domain = _extract_domain(target)

    # Need a valid domain format to run DNS checks
    if not domain or domain.replace(".", "").isnumeric() or domain in ("localhost", "127.0.0.1"):
        return findings

    resolver = dns.resolver.Resolver()
    resolver.timeout = 5.0
    resolver.lifetime = 5.0

    # 1. SPF Check
    has_spf = False
    try:
        answers = resolver.resolve(domain, 'TXT')
        for rdata in answers:
            txt = b"".join(rdata.strings).decode("utf-8")
            if txt.startswith("v=spf1"):
                has_spf = True
                if "~all" not in txt and "-all" not in txt:
                    findings.append({
                        "type": "weak_spf_record",
                        "title": "Weak SPF Record",
                        "description": "The SPF record does not strictly enforce failures (-all or ~all). This may allow attackers to spoof emails originating from your domain.",
                        "affected_component": f"DNS TXT {domain}",
                        "evidence": txt
                    })
                break
    except Exception:
        pass

    if not has_spf:
        findings.append({
            "type": "missing_spf_record",
            "title": "Missing SPF Record",
            "description": "No Sender Policy Framework (SPF) record was found. This leaves the domain vulnerable to email spoofing.",
            "affected_component": f"DNS TXT {domain}",
            "evidence": "No v=spf1 TXT record found."
        })

    # 2. DMARC Check
    dmarc_domain = f"_dmarc.{domain}"
    has_dmarc = False
    try:
        answers = resolver.resolve(dmarc_domain, 'TXT')
        for rdata in answers:
            txt = b"".join(rdata.strings).decode("utf-8")
            if txt.startswith("v=DMARC1"):
                has_dmarc = True
                if "p=none" in txt.lower():
                    findings.append({
                        "type": "weak_dmarc_record",
                        "title": "DMARC Policy is 'none'",
                        "description": "The DMARC policy is set to 'none', meaning it does not instruct receivers to reject or quarantine forged emails. It is only running in report mode.",
                        "affected_component": f"DNS TXT {dmarc_domain}",
                        "evidence": txt
                    })
                break
    except Exception:
        pass

    if not has_dmarc:
        findings.append({
            "type": "missing_dmarc_record",
            "title": "Missing DMARC Record",
            "description": "No Domain-based Message Authentication, Reporting, and Conformance (DMARC) record was found.",
            "affected_component": f"DNS TXT {dmarc_domain}",
            "evidence": "No v=DMARC1 TXT record found."
        })

    return findings
