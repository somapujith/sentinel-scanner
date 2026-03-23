import os
import sys
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_url = "sqlite:///" + path.replace("\\", "/")
    monkeypatch.setenv("DATABASE_URL", db_url)

    for mod in ("main", "services.scan_runner", "models", "database", "security", "config"):
        sys.modules.pop(mod, None)

    import database
    import main

    database.init_db()

    with TestClient(main.app) as c:
        yield c

    try:
        os.unlink(path)
    except OSError:
        pass


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_scan_requires_consent(client):
    r = client.post(
        "/api/scans",
        json={
            "target": "https://example.com",
            "modules": ["port"],
            "consent": False,
        },
    )
    assert r.status_code == 400


def test_create_scan_with_consent(client):
    r = client.post(
        "/api/scans",
        json={
            "target": "https://example.com",
            "modules": ["port"],
            "consent": True,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "scan_id" in data
    sid = data["scan_id"]

    d = client.delete(f"/api/scans/{sid}")
    assert d.status_code == 204

    g = client.get(f"/api/scans/{sid}")
    assert g.status_code == 404
