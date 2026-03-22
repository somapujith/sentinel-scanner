from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv


async def explain_finding(finding: dict[str, Any], target_hint: str) -> dict[str, Any]:
    """Return plain-language explanation; prioritizes Gemini, OpenRouter, then OpenAI/Anthropic."""
    # Force reload .env to catch any new user-added keys without server restart
    from dotenv import load_dotenv
    import os
    load_dotenv(override=True)
    
    return await _query_llm(
        "You are a professional security analyst. In under 180 words, explain this finding to a developer, "
        "why it matters, and 2 concrete remediation steps. No markdown headings.\n\n"
        f"Target context: {target_hint or 'unknown'}\n\n"
        f"Finding JSON: {finding}",
        fallback_text=_fallback_text(finding, target_hint)
    )

async def batch_explain_findings(findings: list[dict[str, Any]], target_hint: str) -> dict[str, Any]:
    from dotenv import load_dotenv
    import json
    load_dotenv(override=True)
    
    return await _query_llm(
        "You are a Senior DevSecOps Engineer. The user has requested a batch explanation of "
        f"{len(findings)} high-severity findings for the target {target_hint or 'unknown'}. "
        "Write a concise, 3-paragraph executive summary detailing the overarching security posture "
        "and prioritized remediation steps. Do not explain every single finding individually, "
        "but summarize the classes of vulnerabilities found and the main risk.\n\n"
        f"Findings JSON: {json.dumps(findings)}",
        fallback_text="AI keys not configured. To enable batch executive summaries, please configure GEMINI_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY in the backend .env file."
    )

async def _query_llm(prompt: str, fallback_text: str) -> dict[str, Any]:
    import os
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    
    print(f"DEBUG: Found keys - Gemini: {'Yes' if gemini_key else 'No'}, OpenRouter: {'Yes' if openrouter_key else 'No'}, OpenAI: {'Yes' if openai_key else 'No'}")
    
    # 1. Try Google Gemini (Generous free tier)
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    headers={"Content-Type": "application/json"}
                )
                r.raise_for_status()
                data = r.json()
                if "candidates" not in data:
                    print(f"DEBUG: Gemini API error - {data}")
                    raise Exception("Gemini malformed response")
                out = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"explanation": out.strip(), "source": "gemini"}
        except Exception as e:
            print(f"DEBUG: Gemini call failed - {e}")
            pass

    # 2. Try OpenRouter (Versatile multi-model fallback)
    if openrouter_key:
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                r = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://sentinel-scanner.app", # Optional for OpenRouter
                        "X-Title": "Sentinel Scanner",
                    },
                    json={
                        "model": "openai/gpt-4o-mini", # Or "google/gemini-flash-1.5"
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 512,
                    },
                )
                r.raise_for_status()
                data = r.json()
                if "choices" not in data:
                    print(f"DEBUG: OpenRouter API error - {data}")
                    raise Exception("OpenRouter malformed response")
                out = data["choices"][0]["message"]["content"]
                return {"explanation": out.strip(), "source": "openrouter"}
        except Exception as e:
            print(f"DEBUG: OpenRouter call failed - {e}")
            pass

    # 3. Try OpenAI (Standard fallback)
    if openai_key:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "system", "content": "You are a security analyst."}, {"role": "user", "content": prompt}],
                        "max_tokens": 512,
                    },
                )
                r.raise_for_status()
                data = r.json()
                out = data["choices"][0]["message"]["content"]
                return {"explanation": out.strip(), "source": "openai"}
        except Exception:
            pass

    # 4. Try Anthropic (Original implementation)
    if anthropic_key:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": anthropic_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                    json={"model": "claude-3-5-haiku-20241022", "max_tokens": 512, "messages": [{"role": "user", "content": prompt}]},
                )
                r.raise_for_status()
                data = r.json()
                out = data["content"][0]["text"]
                return {"explanation": out.strip(), "source": "anthropic"}
        except Exception:
            pass

    # Final Fallback (Local Summary)
    return {"explanation": text, "source": "local"}


def _fallback_text(finding: dict[str, Any], target_hint: str) -> str:
    t = finding.get("type", "issue")
    title = finding.get("title", t)
    mit = finding.get("mitigation", "")
    return (
        f"{title} ({t}) affects components exposed on {target_hint or 'the target'}. "
        f"Risk level: {finding.get('risk', 'unknown')} with approximate score {finding.get('cvss', 0)}. "
        f"Remediation: {mit or 'follow OWASP guidance for this class of vulnerability.'}"
    )
