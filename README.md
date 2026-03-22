# Vulnerability Scanner

Security audit dashboard: **FastAPI** backend with **live** checks (TCP ports, TLS, HTTP headers, reflected-input probes), **SQLite** scan history, weighted **CVSS-style** risk scores, mitigations, and a **React + Tailwind** UI. Text report download is structured; swap in ReportLab/WeasyPrint for PDF when ready.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API: `http://127.0.0.1:8000` · OpenAPI: `/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5178`. Vite proxies `/api` to port 8000.

**Frontend stack:** React 18, **React Router** — marketing **`/`**, app **`/app`**, scan detail **`/scan/:scanId`**, scheduled **`/scheduled`**, **`/docs`**, **`/security`** (see `PRD.md`). **Lucide** icons, **clsx** + **tailwind-merge** (`src/lib/cn.js`). Optional **`VITE_API_KEY`** if the API requires authentication. After pulling changes, run `npm install` so `node_modules` matches `package.json`.

### Docker

From `vulnerability-scanner/`:

```bash
docker compose up --build
```

- UI: `http://localhost:5178`
- API: `http://localhost:8000`

SQLite data is stored in the `scanner-data` volume at `/app/data/scans.db` in the backend container.

## What is implemented

- `POST /api/scans` — queue a scan (requires **`consent: true`**; stores consent time + client IP; optional **daily/weekly** schedule)
- `GET /api/scans` — list recent scans
- `GET /api/scans/{id}` — status + modules + consent metadata + scored findings (risk + mitigation)
- `GET /api/scans/compare?left=&right=` — diff two completed scans (only left / only right / unchanged counts)
- `GET /api/scans/{id}/events` — **SSE** status stream while a scan runs
- `POST /api/explain` — plain-language finding explanation (**`ANTHROPIC_API_KEY`** optional; local fallback if unset)
- `GET /api/scans/{id}/report` — **PDF** report (ReportLab: cover, colored risk table, detail cards, checklist; filename `sentinel-scan-{id}.pdf`)
- **`DELETE /api/scans/{id}`** — remove a scan and its findings (SQLAlchemy cascade)
- **`GET /api/scans/{id}/export?format=json|csv`** — download findings
- **`GET /api/scheduled-scans`**, **`PATCH`**, **`DELETE`**, **`POST .../run`** — manage recurring jobs (see **`SECURITY.md`** for `EventSource` + API keys)
- **Retention** — `SENTINEL_RETENTION_DAYS` (hourly purge of old scans; `0` = off)
- **CORS** — `SENTINEL_CORS_ORIGINS`; **trusted proxies** — `SENTINEL_TRUSTED_PROXY_IPS` (see **`SECURITY.md`**)
- **Optional API keys** — `SENTINEL_REQUIRE_API_KEY` + `SENTINEL_API_KEYS`; rate limit key = hash of key or client IP
- Rate limiting on `POST /api/scans` and **`POST /api/scheduled-scans/{id}/run`** (SlowAPI; default `SENTINEL_RATE_LIMIT`)
- **`scanner/port_scanner.py`** — parallel TCP connect scan of common ports; only open ports generate findings.
- **`scanner/ssl_checker.py`** — TLS handshake; certificate expiry, weak protocol/cipher, or `ssl_ok` when no issues.
- **`scanner/header_checker.py`** — live `httpx` fetch; CSP, HSTS, X-Frame, X-Content-Type; optional `robots.txt` gate.
- **`scanner/injection_probe.py`** — GET probes; reports **verbatim reflection** of XSS/SQLi test strings (not exploit confirmation).
- **`engine/risk_scorer.py`** — per-type weights, low/med/high/critical, mitigations.
- TLS: **`backend/.env`** (`python-dotenv`) and **`SCANNER_SSL_VERIFY`** — see **`backend/.env.example`**.

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy URL (default: SQLite `backend/scans.db`) |
| `ANTHROPIC_API_KEY` | Enables Claude explanations in `POST /api/explain` |
| `SCANNER_SSL_VERIFY` | TLS verification for live HTTP/TLS checks (see `backend/.env.example`) |
| `SENTINEL_CORS_ORIGINS` | Comma-separated browser origins (default: local dev + Docker UI) |
| `SENTINEL_TRUSTED_PROXY_IPS` | IPs/CIDRs of reverse proxies that may set `X-Forwarded-For` |
| `SENTINEL_REQUIRE_API_KEY` | Set to `1` to require `X-API-Key` / `Authorization: Bearer` on `/api/*` (except `/api/health`) |
| `SENTINEL_API_KEYS` | Comma-separated API secrets |
| `SENTINEL_RATE_LIMIT` | SlowAPI limit, e.g. `30/minute` |
| `SENTINEL_RETENTION_DAYS` | Delete scans older than N days (`0` = disabled) |
| `SENTINEL_LOG_LEVEL` | Python log level (default `INFO`) |

See **`SECURITY.md`** and **`backend/.env.example`**. Frontend: **`VITE_API_KEY`** mirrors server keys when auth is enabled.

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```
