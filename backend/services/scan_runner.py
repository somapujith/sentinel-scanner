from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable

from sqlalchemy import select

from database import get_session
from engine.risk_scorer import score_findings
from logging_config import safe_scan_failure_reason
from models import Finding, Scan, ScheduledScan
from scanner import header_checker, injection_probe, port_scanner, ssl_checker

ALLOWED_MODULES = frozenset({"port", "header", "ssl", "inject"})

MODULE_MAP = {
    "port": port_scanner.run,
    "header": header_checker.run,
    "ssl": ssl_checker.run,
    "inject": injection_probe.run,
}


def _update_scan(scan_id: str, status: str) -> None:
    with get_session() as session:
        scan = session.get(Scan, scan_id)
        if scan:
            scan.status = status


async def run_scan(scan_id: str, target: str, modules: list[str]) -> None:
    all_findings: list[dict[str, Any]] = []
    try:
        for mod_id in modules:
            _update_scan(scan_id, status=f"running:{mod_id}")
            runner = MODULE_MAP[mod_id]
            chunk = await asyncio.to_thread(runner, target)
            all_findings.extend(chunk)

        scored = score_findings(all_findings)
        with get_session() as session:
            scan = session.get(Scan, scan_id)
            if not scan:
                return
            for f in scored:
                session.add(Finding.from_dict(scan_id, f))
            scan.status = "complete"
    except Exception as e:  # noqa: BLE001
        _update_scan(scan_id, status=f"failed:{safe_scan_failure_reason(e)}")


def schedule_recurring_job(target: str, modules: list[str], schedule: str, notify_email: str | None) -> None:
    if schedule not in ("daily", "weekly"):
        return
    delta = timedelta(days=1) if schedule == "daily" else timedelta(weeks=1)
    next_at = datetime.now(timezone.utc) + delta
    with get_session() as session:
        job = ScheduledScan(
            id=str(uuid.uuid4()),
            target=target,
            modules_json=json.dumps(modules),
            schedule=schedule,
            notify_email=notify_email,
            next_run_at=next_at,
        )
        session.add(job)


async def process_due_scheduled_scans(
    run_callback: Callable[[str, str, list[str]], Awaitable[None]],
) -> None:
    now = datetime.now(timezone.utc)
    with get_session() as session:
        rows = session.scalars(
            select(ScheduledScan).where(ScheduledScan.next_run_at <= now, ScheduledScan.enabled.is_(True))
        ).all()
        jobs = list(rows)

    for job in jobs:
        try:
            modules = json.loads(job.modules_json or "[]")
        except json.JSONDecodeError:
            continue
        modules = [m for m in modules if m in ALLOWED_MODULES]
        if not modules:
            continue
        scan_id = str(uuid.uuid4())
        with get_session() as session:
            j = session.get(ScheduledScan, job.id)
            if not j or not j.enabled:
                continue
            scan = Scan(
                id=scan_id,
                target=j.target,
                status="queued",
                schedule=j.schedule,
                notify_email=j.notify_email,
                modules_json=j.modules_json,
                consent_at=now,
                consent_ip="scheduler",
            )
            session.add(scan)
            delta = timedelta(days=1) if j.schedule == "daily" else timedelta(weeks=1)
            j.next_run_at = now + delta

        await run_callback(scan_id, job.target, modules)


def enqueue_scan_from_schedule_job(job_id: str, consent_ip: str) -> tuple[str, str, list[str]] | None:
    """Create a Scan row from a ScheduledScan. Does not advance next_run_at. Returns (scan_id, target, modules)."""
    now = datetime.now(timezone.utc)
    with get_session() as session:
        job = session.get(ScheduledScan, job_id)
        if not job:
            return None
        try:
            modules = json.loads(job.modules_json or "[]")
        except json.JSONDecodeError:
            return None
        modules = [m for m in modules if m in ALLOWED_MODULES]
        if not modules:
            return None
        target = job.target
        scan_id = str(uuid.uuid4())
        scan = Scan(
            id=scan_id,
            target=target,
            status="queued",
            schedule=job.schedule,
            notify_email=job.notify_email,
            modules_json=job.modules_json,
            consent_at=now,
            consent_ip=consent_ip[:64],
        )
        session.add(scan)
    return scan_id, target, modules
