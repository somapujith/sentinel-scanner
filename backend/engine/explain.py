from __future__ import annotations

import os
from typing import Any

import httpx


async def explain_finding(finding: dict[str, Any], target_hint: str) -> dict[str, Any]:
    """Return plain-language explanation; uses Anthropic API if ANTHROPIC_API_KEY is set."""
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    text = _fallback_text(finding, target_hint)
    if not key:
        return {"explanation": text, "source": "local"}

    prompt = (
        "You are a security analyst. In under 180 words, explain this finding to a developer, "
        "why it matters, and 2 concrete remediation steps. No markdown headings.\n\n"
        f"Target context: {target_hint or 'unknown'}\n\n"
        f"Finding JSON: {finding}"
    )
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-haiku-20241022",
                    "max_tokens": 512,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            r.raise_for_status()
            data = r.json()
            block = data.get("content", [{}])[0]
            out = block.get("text", text) if isinstance(block, dict) else text
            return {"explanation": out.strip(), "source": "anthropic"}
    except Exception as e:  # noqa: BLE001
        return {
            "explanation": f"{text}\n\n(API error: {e})",
            "source": "local+fallback",
        }


def _fallback_text(finding: dict[str, Any], target_hint: str) -> str:
    t = finding.get("type", "issue")
    title = finding.get("title", t)
    mit = finding.get("mitigation", "")
    return (
        f"{title} ({t}) affects components exposed on {target_hint or 'the target'}. "
        f"Risk level: {finding.get('risk', 'unknown')} with approximate score {finding.get('cvss', 0)}. "
        f"Remediation: {mit or 'follow OWASP guidance for this class of vulnerability.'}"
    )
