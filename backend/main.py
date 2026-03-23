from __future__ import annotations

import asyncio
import csv
import io
import json
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import BackgroundTasks, Body, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import select

from config import (
    cors_origins,
    rate_limit_string,
    retention_days,
    validate_auth_config,
)
from database import get_session, init_db
from engine.compare import compare_findings
from engine.explain import explain_finding
from engine.report_gen import build_pdf_report
from engine.risk_scorer import aggregate_score
from logging_config import setup_logging
from models import Finding, Scan, ScheduledScan
from schemas import (
    BatchExplainRequest,
    ExplainRequest,
    ExplainResponse,
    ScanCreated,
    ScanDetail,
    ScanRequest,
    ScheduledScanOut,
    ScheduledScanPatch,
)
from security import client_ip, rate_limit_key
from services.scan_runner import (
    ALLOWED_MODULES,
    enqueue_scan_from_schedule_job,
    process_due_scheduled_scans,
    run_scan,
    schedule_recurring_job,
)

limiter = Limiter(key_func=rate_limit_key)

# SlowAPI's @limiter.limit breaks FastAPI body injection for POST handlers that use Body() +
# BackgroundTasks (parameters become query: req, bg). Use the same key as SlowAPI + in-memory window.
_rate_limit_hits: dict[str, list[float]] = defaultdict(list)


def _parse_rate_limit(s: str) -> tuple[int, float]:
    s = (s or "30/minute").strip().lower()
    parts = s.split("/")
    if len(parts) != 2:
        return 30, 60.0
    try:
        n = int(parts[0].strip())
    except ValueError:
        return 30, 60.0
    unit = parts[1].strip().rstrip("s")
    if unit in ("minute", "min", "m"):
        return n, 60.0
    if unit in ("second", "sec", "s"):
        return n, 1.0
    if unit in ("hour", "hr", "h"):
        return n, 3600.0
    return n, 60.0


def _enforce_rate_limit(request: Request) -> None:
    limit, window_sec = _parse_rate_limit(rate_limit_string())
    key = rate_limit_key(request)
    now = time.monotonic()
    bucket = _rate_limit_hits[key]
    bucket[:] = [t for t in bucket if now - t < window_sec]
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    bucket.append(now)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_auth_config()
    setup_logging()
    init_db()

    async def scheduler_loop() -> None:
        while True:
            try:
                await asyncio.sleep(60)
                await process_due_scheduled_scans(run_scan)
            except asyncio.CancelledError:
                break
            except Exception:  # noqa: BLE001
                pass

    async def retention_loop() -> None:
        while True:
            try:
                await asyncio.sleep(3600)
                days = retention_days()
                if days <= 0:
                    continue
                cutoff = datetime.now(timezone.utc) - timedelta(days=days)
                with get_session() as session:
                    old = session.scalars(select(Scan).where(Scan.created_at < cutoff)).all()
                    for s in old:
                        session.delete(s)
            except asyncio.CancelledError:
                break
            except Exception:  # noqa: BLE001
                pass

    t1 = asyncio.create_task(scheduler_loop())
    t2 = asyncio.create_task(retention_loop())
    yield
    t1.cancel()
    t2.cancel()
    try:
        await t1
    except asyncio.CancelledError:
        pass
    try:
        await t2
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Sentinel Scanner API", version="0.3.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def sentinel_auth_middleware(request: Request, call_next):
    # Authentication has been fully disabled for this deployment.
    # Keep the middleware to ensure CORS preflight (`OPTIONS`) behaves consistently.
    if request.method == "OPTIONS":
        return await call_next(request)
    return await call_next(request)


@app.get("/", include_in_schema=False)
def root():
    return {
        "service": "Sentinel Scanner API",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/api/health",
        "hint": "UI: http://127.0.0.1:5178",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/scans", response_model=ScanCreated)
async def create_scan(
    request: Request,
    req: Annotated[ScanRequest, Body()],
    bg: BackgroundTasks,
):
    _enforce_rate_limit(request)
    if not req.consent:
        raise HTTPException(
            status_code=400,
            detail="You must confirm you are authorized to scan this target.",
        )
    modules = [m for m in req.modules if m in ALLOWED_MODULES]
    if not modules:
        raise HTTPException(status_code=400, detail="Select at least one valid module: port, header, ssl, inject")

    scan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    ip = client_ip(request)
    target_clean = req.target.strip()
    
    with get_session() as session:
        # Prevent starting duplicate scans of the exact same target and modules if already running
        existing = session.scalars(
            select(Scan).where(Scan.target == target_clean, Scan.status.in_(("queued", "running")))
        ).all()
        for ex in existing:
            try:
                ex_mods = json.loads(ex.modules_json or "[]")
            except json.JSONDecodeError:
                continue
            if set(ex_mods) == set(modules):
                return ScanCreated(scan_id=ex.id)

        scan = Scan(
            id=scan_id,
            target=target_clean,
            status="queued",
            schedule=req.schedule or "once",
            notify_email=req.notify_email,
            modules_json=json.dumps(modules),
            consent_at=now,
            consent_ip=ip,
        )
        session.add(scan)

    if req.schedule in ("daily", "weekly"):
        schedule_recurring_job(req.target.strip(), modules, req.schedule, req.notify_email)

    bg.add_task(run_scan, scan_id, req.target.strip(), modules)
    return ScanCreated(scan_id=scan_id)


@app.get("/api/scans")
def list_scans(limit: int = 50):
    limit = min(max(limit, 1), 200)
    with get_session() as session:
        rows = session.scalars(select(Scan).order_by(Scan.created_at.desc()).limit(limit)).all()
        return [
            {
                "id": s.id,
                "target": s.target,
                "status": s.status,
                "created_at": s.created_at.isoformat(),
            }
            for s in rows
        ]


@app.get("/api/scans/history")
def target_history(target: str, limit: int = 15):
    """Return historical scores for a target to render a trend chart."""
    limit = min(max(limit, 1), 50)
    
    # Very generous domain matching
    t_clean = target.replace("https://", "").replace("http://", "").split("/")[0].strip()
    
    with get_session() as session:
        # Get all completed scans for this vaguely matching target
        rows = session.scalars(
            select(Scan)
            .where(Scan.target.ilike(f"%{t_clean}%"))
            .where(Scan.status == "complete")
            .order_by(Scan.created_at.asc())
            .limit(limit)
        ).all()
        
        result = []
        for r in rows:
            f_rows = session.scalars(select(Finding).where(Finding.scan_id == r.id)).all()
            f_dicts = [f.as_dict() for f in f_rows]
            
            score = aggregate_score(f_dicts)
            # Invert CVSS to Health Score (0-10) for easier reading
            health_score = max(0.0, 10.0 - score)
            
            result.append({
                "scan_id": r.id,
                "created_at": r.created_at.isoformat(),
                "health_score": round(health_score, 1)
            })
            
        return result


@app.delete("/api/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: str):
    with get_session() as session:
        scan = session.get(Scan, scan_id)
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        session.delete(scan)
    return Response(status_code=204)


@app.get("/api/scans/compare")
def compare_scans(left: str, right: str):
    with get_session() as session:
        a = session.get(Scan, left)
        b = session.get(Scan, right)
        if not a or not b:
            raise HTTPException(status_code=404, detail="One or both scans not found")
        lt, rt = a.target, b.target
        la = session.scalars(select(Finding).where(Finding.scan_id == left)).all()
        lb = session.scalars(select(Finding).where(Finding.scan_id == right)).all()
        fa = [x.as_dict() for x in la]
        fb = [x.as_dict() for x in lb]
    diff = compare_findings(fa, fb)
    return {
        "left_scan_id": left,
        "right_scan_id": right,
        "left_target": lt,
        "right_target": rt,
        **diff,
    }


@app.get("/api/scans/{scan_id}", response_model=ScanDetail)
def get_scan(scan_id: str):
    with get_session() as session:
        scan = session.get(Scan, scan_id)
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        rows = session.scalars(select(Finding).where(Finding.scan_id == scan_id)).all()
        findings = [r.as_dict() for r in rows]
        agg = aggregate_score(findings) if findings else 0.0
        try:
            mods = json.loads(scan.modules_json or "[]")
        except json.JSONDecodeError:
            mods = []
        return ScanDetail(
            id=scan.id,
            target=scan.target,
            status=scan.status,
            schedule=scan.schedule,
            notify_email=scan.notify_email,
            modules=mods if isinstance(mods, list) else [],
            consent_at=scan.consent_at,
            consent_ip=scan.consent_ip,
            created_at=scan.created_at,
            updated_at=scan.updated_at,
            findings=findings,
            aggregate_cvss=round(agg, 2),
        )


@app.get("/api/scans/{scan_id}/export")
def export_scan(
    scan_id: str,
    export_format: str = Query("json", alias="format", pattern="^(json|csv)$"),
):
    with get_session() as session:
        scan = session.get(Scan, scan_id)
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        rows = session.scalars(select(Finding).where(Finding.scan_id == scan_id)).all()
        findings = [r.as_dict() for r in rows]

    if export_format == "json":
        body = json.dumps(
            {"scan_id": scan_id, "target": scan.target, "findings": findings},
            indent=2,
        )
        return Response(
            content=body,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="sentinel-{scan_id}.json"'},
        )

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["type", "title", "risk", "cvss", "description", "affected_component", "mitigation"])
    for f in findings:
        w.writerow(
            [
                f.get("type", ""),
                f.get("title", ""),
                f.get("risk", ""),
                f.get("cvss", ""),
                (f.get("description") or "").replace("\n", " ")[:2000],
                f.get("affected_component", ""),
                (f.get("mitigation") or "").replace("\n", " ")[:2000],
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="sentinel-{scan_id}.csv"'},
    )


@app.get("/api/scans/{scan_id}/events")
async def scan_events(scan_id: str):
    async def gen():
        while True:
            await asyncio.sleep(0.45)
            with get_session() as session:
                scan = session.get(Scan, scan_id)
                if not scan:
                    yield f"data: {json.dumps({'error': 'not_found'})}\n\n"
                    return
                st = scan.status or ""
            payload = json.dumps({"status": st})
            yield f"data: {payload}\n\n"
            if st == "complete" or st.startswith("failed"):
                return

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest):
    out = await explain_finding(req.finding, req.target_hint)
    return ExplainResponse(explanation=out.get("explanation", ""), source=out.get("source", "local"))


@app.post("/api/batch-explain", response_model=ExplainResponse)
async def batch_explain_api(req: BatchExplainRequest):
    from engine.explain import batch_explain_findings
    if not req.findings:
        return ExplainResponse(explanation="No findings provided for batch explanation.", source="local")
    out = await batch_explain_findings(req.findings[:5], req.target_hint) # Cap at 5 to save tokens
    return ExplainResponse(explanation=out.get("explanation", ""), source=out.get("source", "local"))


# --- EPSS: Exploit Prediction Scoring System ---
@app.get("/api/epss")
async def get_epss(cve: str = Query(..., description="CVE ID e.g. CVE-2021-44228")):
    """Fetch EPSS score/percentile from api.first.org for a given CVE."""
    import httpx as _httpx
    cve_clean = cve.strip().upper()
    if not cve_clean.startswith("CVE-"):
        raise HTTPException(status_code=400, detail="Invalid CVE ID format. Use CVE-YYYY-NNNNN.")
    try:
        async with _httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"https://api.first.org/data/v1/epss?cve={cve_clean}",
                headers={"Accept": "application/json"},
            )
            r.raise_for_status()
            data = r.json()
        items = data.get("data", [])
        if not items:
            return {"cve": cve_clean, "epss": None, "percentile": None, "message": "CVE not in EPSS database"}
        item = items[0]
        return {
            "cve": cve_clean,
            "epss": float(item.get("epss", 0)),
            "percentile": float(item.get("percentile", 0)),
            "date": item.get("date"),
        }
    except _httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"EPSS API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"EPSS fetch failed: {str(e)}")


# --- Attack Path: Build attack chain from a finding ---
@app.post("/api/attack-path")
async def attack_path(finding: dict = Body(...)):
    """
    Derive a simplified attack path from a finding dict.
    Returns a list of steps from entry point to vulnerable sink.
    """
    ftype = finding.get("type", "unknown")
    risk = (finding.get("risk") or "low").lower()
    component = finding.get("affected_component", "web service")
    title = finding.get("title", ftype)
    mitigation = finding.get("mitigation", "")

    # Map finding types to attack chains
    CHAINS: dict[str, list[dict]] = {
        "header": [
            {"label": "Entry Point", "desc": f"Attacker crafts a request targeting {component}"},
            {"label": "Missing Defence", "desc": f"No protective HTTP header ({title}) present in server response"},
            {"label": "Browser Exploit", "desc": "Browser executes malicious content or leaks sensitive data"},
            {"label": "Vulnerable Sink", "desc": f"User's browser / client is compromised. Severity: {risk.upper()}"},
        ],
        "ssl": [
            {"label": "Entry Point", "desc": "Attacker intercepts traffic between client and server (MITM)"},
            {"label": "Weak Encryption", "desc": f"TLS misconfiguration allows downgrade or eavesdropping ({title})"},
            {"label": "Data Interception", "desc": "Sensitive data in transit is exposed in cleartext"},
            {"label": "Vulnerable Sink", "desc": "Credentials, tokens, or PII are exfiltrated"},
        ],
        "port": [
            {"label": "Entry Point", "desc": "Attacker scans the target and finds exposed service"},
            {"label": "Service Discovery", "desc": f"Open port exposes: {component}"},
            {"label": "Service Exploit", "desc": "Unpatched service or default credentials allow access"},
            {"label": "Vulnerable Sink", "desc": f"Full service compromise. Risk: {risk.upper()}"},
        ],
        "inject": [
            {"label": "Entry Point", "desc": f"Attacker sends crafted input to {component}"},
            {"label": "Insufficient Validation", "desc": f"Server reflects or processes input without sanitization ({title})"},
            {"label": "Payload Execution", "desc": "Malicious script or query runs in victim's browser or database"},
            {"label": "Vulnerable Sink", "desc": "Session hijack, data exfiltration, or unauthorized DB access"},
        ],
        "cors": [
            {"label": "Entry Point", "desc": "Attacker hosts malicious site that sends XHR to target"},
            {"label": "Permissive CORS", "desc": f"Server responds with permissive Access-Control-Allow-Origin ({title})"},
            {"label": "Cross-origin Read", "desc": "Malicious script reads sensitive response data from target"},
            {"label": "Vulnerable Sink", "desc": "User's authenticated data leaked to attacker's origin"},
        ],
        "dns": [
            {"label": "Entry Point", "desc": "Attacker queries DNS records for the target"},
            {"label": "DNS Misconfiguration", "desc": f"{title} — exposed record or missing email security policy"},
            {"label": "Abuse Vector", "desc": "Zone transfer reveals internal hosts, or email spoofing becomes possible"},
            {"label": "Vulnerable Sink", "desc": "Internal infrastructure mapped or phishing attacks enabled"},
        ],
    }

    # Match chain by finding type prefix
    chain = None
    for key, steps in CHAINS.items():
        if key in ftype.lower():
            chain = steps
            break

    if not chain:
        chain = [
            {"label": "Entry Point", "desc": f"Attacker targets: {component or 'the application'}"},
            {"label": "Vulnerability Triggered", "desc": f"{title} ({ftype}) is exploited"},
            {"label": "Vulnerable Sink", "desc": f"Risk: {risk.upper()}. {mitigation or 'Apply recommended mitigations.'}"},
        ]

    return {"finding_type": ftype, "risk": risk, "steps": chain}



@app.get("/api/scans/{scan_id}/report")
def download_report(scan_id: str):
    with get_session() as session:
        scan = session.get(Scan, scan_id)
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        target = scan.target
        rows = session.scalars(select(Finding).where(Finding.scan_id == scan_id)).all()
        findings = [r.as_dict() for r in rows]
    try:
        body = build_pdf_report(scan_id, target, findings)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail="PDF generation failed. If findings contain unusual characters, try again or check server logs.",
        ) from e
    return Response(
        content=body,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="sentinel-scan-{scan_id}.pdf"',
        },
    )


def _scheduled_to_out(row: ScheduledScan) -> ScheduledScanOut:
    try:
        mods = json.loads(row.modules_json or "[]")
    except json.JSONDecodeError:
        mods = []
    return ScheduledScanOut(
        id=row.id,
        target=row.target,
        schedule=row.schedule,
        modules=mods if isinstance(mods, list) else [],
        notify_email=row.notify_email,
        next_run_at=row.next_run_at,
        enabled=row.enabled,
        created_at=row.created_at,
    )


@app.get("/api/scheduled-scans", response_model=list[ScheduledScanOut])
def list_scheduled_scans():
    with get_session() as session:
        rows = session.scalars(select(ScheduledScan).order_by(ScheduledScan.next_run_at.asc())).all()
        return [_scheduled_to_out(r) for r in rows]


@app.patch("/api/scheduled-scans/{job_id}", response_model=ScheduledScanOut)
def patch_scheduled_scan(job_id: str, body: ScheduledScanPatch):
    with get_session() as session:
        job = session.get(ScheduledScan, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Scheduled job not found")
        job.enabled = body.enabled
        return _scheduled_to_out(job)


@app.delete("/api/scheduled-scans/{job_id}", status_code=204)
def delete_scheduled_scan(job_id: str):
    with get_session() as session:
        job = session.get(ScheduledScan, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Scheduled job not found")
        session.delete(job)
    return Response(status_code=204)


@app.post("/api/scheduled-scans/{job_id}/run", status_code=202)
async def run_scheduled_now(job_id: str, request: Request, bg: BackgroundTasks):
    _enforce_rate_limit(request)
    ip = client_ip(request)
    out = enqueue_scan_from_schedule_job(job_id, ip)
    if not out:
        raise HTTPException(status_code=404, detail="Scheduled job not found or invalid modules")
    scan_id, target, modules = out
    bg.add_task(run_scan, scan_id, target, modules)
    return {"scan_id": scan_id, "status": "queued"}
