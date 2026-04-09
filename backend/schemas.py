from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    target: str = Field(
        ...,
        min_length=3,
        max_length=255,
        pattern=r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[a-zA-Z0-9_-.-]*)*$|^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$",
        description="A valid domain name or IPv4 address."
    )
    modules: list[str] = Field(default_factory=list, max_length=20)
    schedule: str = Field("once", max_length=50)
    notify_email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", max_length=255)
    consent: bool = False


class ScanCreated(BaseModel):
    scan_id: str


class FindingOut(BaseModel):
    model_config = {"extra": "allow"}

    type: str
    title: Optional[str] = None
    cvss: float = 0.0
    risk: str = "low"


class ScanDetail(BaseModel):
    id: str
    target: str
    status: str
    schedule: str
    notify_email: Optional[str] = None
    modules: list[str] = Field(default_factory=list)
    consent_at: Optional[datetime] = None
    consent_ip: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    findings: list[dict[str, Any]] = Field(default_factory=list)
    aggregate_cvss: float = 0.0


class ExplainRequest(BaseModel):
    finding: dict[str, Any]
    target_hint: str = ""


class BatchExplainRequest(BaseModel):
    findings: list[dict[str, Any]]
    target_hint: str = ""


class ExplainResponse(BaseModel):
    explanation: str
    source: str = "local"


class ScheduledScanOut(BaseModel):
    id: str
    target: str
    schedule: str
    modules: list[str] = Field(default_factory=list)
    notify_email: Optional[str] = None
    next_run_at: datetime
    enabled: bool
    created_at: datetime


class ScheduledScanPatch(BaseModel):
    enabled: bool


class AuthRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=255)
