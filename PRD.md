# Product Requirements Document (PRD)

**Product name (working):** Sentinel Scanner  
**Type:** Web security audit / lightweight vulnerability assessment tool  
**Stack (current):** FastAPI backend · React + Vite + Tailwind frontend · SQLite history · PDF (ReportLab)  
**Document purpose:** Guide UX, marketing copy, landing page structure, and AI-assisted visual design.

---

## 1. Vision & positioning

### 1.1 One-liner
A browser-based **security posture snapshot** for a single URL or IP: discover exposed services, review TLS and HTTP headers, and surface reflection-style signals—with **risk scoring**, **mitigations**, and **exportable reports**—while requiring **explicit authorization** before any probe runs.

### 1.2 Value proposition
- **Fast feedback:** Minutes from “I have a URL” to a structured list of findings with severity-style labels.
- **Explainable:** Each finding ties to a module (ports, TLS, headers, reflection probes) with remediation hints.
- **Responsible by design:** Consent + IP logging; intrusive modules clearly labeled; not positioned as a full pentest replacement.

### 1.3 Non-goals (be honest on the site)
- Not a replacement for full penetration testing, bug bounty triage, or compliance certification.
- Not continuous asset discovery across an entire organization (single-target focus per run).
- “Reflection” probes indicate **echo of test strings**, not confirmed exploitable XSS/SQLi.

---

## 2. Target users & contexts

| Persona | Needs | Tone |
|--------|--------|------|
| **Student / capstone / hackathon** | Demo-ready UI, clear modules, export PDF | Professional, educational |
| **Junior security / IT** | Understand risk labels, compare runs over time | Clear, non-alarmist |
| **Developer (own app)** | Quick TLS/header check before release | Practical, checklist-oriented |

**Primary use case:** Authorized testing of **systems the user owns or has permission to test** (labs, staging, personal sites).

---

## 3. Core product capabilities (feature inventory)

### 3.1 Scan configuration
- **Target:** HTTPS URL or IP (with validation in UI).
- **Modules (selectable):**
  - **Port scan** — TCP connect to common ports; findings for open ports.
  - **HTTP headers** — Live fetch; CSP, HSTS, X-Frame, X-Content-Type, etc.
  - **TLS / SSL** — Certificate lifetime, protocol/cipher posture.
  - **Reflection / injection-style probes** — Marked as **intrusive / careful** in UI; reports verbatim echo of probe strings, not exploit chains.
- **Schedule:** Once, **daily**, or **weekly** (creates recurring job template).
- **Consent:** Required checkbox before launch; server stores consent timestamp and client IP (and honors trusted reverse proxies when configured).

### 3.2 Execution & feedback
- **Background scan** with status progression (queued → running per module → complete / failed).
- **Live updates:** SSE (`/events`) plus polling for scan detail.
- **Risk model:** Aggregate score and per-finding risk tier (e.g. low–critical style) with CVSS-style weighting in engine.

### 3.3 Results & actions
- **Findings list** with title, type, risk, CVSS-style score, description, affected component, mitigation.
- **AI explain (optional):** Server-side explanation via Anthropic when `ANTHROPIC_API_KEY` is set; local fallback text otherwise.
- **Exports:** PDF report, JSON, CSV.
- **Compare two scans:** Counts for only-left / only-right / unchanged findings (baseline vs later run).

### 3.4 History & housekeeping
- **Scan history** sidebar (target, status).
- **Delete scan** (cascades findings).
- **Scheduled scans** page: list jobs, enable/disable, delete, **run now** (extra run without shifting schedule).
- **Optional retention:** Server can purge scans older than N days (ops feature).

### 3.5 Security & operations (for trust section / docs)
- Optional **API keys** for all `/api/*` except health (when enabled).
- **CORS** and **trusted proxy** configuration for real client IP behind nginx/Cloudflare.
- **Rate limits** on sensitive POST endpoints (per key or per IP).

---

## 4. User journeys (for page flows)

### 4.1 First-time visitor (marketing)
1. Lands on **public marketing / landing** → reads what Sentinel does and does not do.
2. CTA: **Open app** / **Try demo** / **Docs**.

### 4.2 Authenticated or open app (product)
1. **Home / dashboard:** Configure scan → launch → see progress → read findings.
2. Optional: open **Scheduled** to manage recurring jobs.
3. Optional: **Compare** two historical runs for the same or different targets.

### 4.3 Power user
- Export PDF/JSON/CSV, enable API key in env for scripted access (advanced section).

---

## 5. Information architecture (suggested site map)

| Area | Route / section | Purpose |
|------|------------------|---------|
| **Marketing** | `/` (public) or `/welcome` | Hero, value prop, modules overview, trust & legal, CTA |
| **App** | `/app` or keep `/` as app | Scanner UI (current “Sentinel” experience) |
| **Scan detail** | `/scan/:id` | Deep dive on one run |
| **Scheduled** | `/scheduled` | Recurring jobs |
| **Docs / Security** | `/docs`, `/security` | How probes work, consent, API keys, limits (can link to repo `SECURITY.md`) |

*Note: Today the app uses `/`, `/scan/:id`, `/scheduled`. A redesign may split **marketing landing** vs **app shell**.*

---

## 6. Content blocks for landing page (copy-ready outlines)

Use these as sections for design / AI generation.

### 6.1 Hero
- **Headline:** e.g. “Surface security signals for any URL you’re authorized to test.”
- **Subhead:** Fast ports, TLS, headers, and reflection-style checks—with scoring and exports.
- **Primary CTA:** Start a scan · **Secondary:** View how it works

### 6.2 “How it works” (3–4 steps)
1. Confirm authorization (consent).
2. Choose modules (skip intrusive probes if you want a lighter pass).
3. Watch live status and review findings.
4. Export PDF or CSV / compare runs over time.

### 6.3 Modules grid
Four cards: **Ports** · **Headers** · **TLS** · **Reflection probes** — each with one sentence + “non-destructive” vs “use with care” badge.

### 6.4 Trust & responsibility
- Consent and IP logging.
- Not for unauthorized scanning; legal/ethical use disclaimer (short).
- Optional: link to security doc (API keys, rate limits, proxies).

### 6.5 Social proof / fit (optional)
- “Built for coursework, labs, and authorized assessments.”
- Logos: university / hackathon / OSS (if applicable).

### 6.6 FAQ (suggested questions)
- Is this a full pentest? **No.**
- Does it exploit vulnerabilities? **No**—it reports configuration issues and reflection signals.
- Can I scan any website? **Only with permission**; misuse is your responsibility.
- Do you store my data? **Scan metadata and findings** in SQLite (or describe your deployment).

### 6.7 Footer
- Links: GitHub, Docs, Security, Contact.
- Version / “FastAPI + React” credit optional.

---

## 7. Home / app page (in-product) sections

These map to existing UI patterns; design refresh can reorganize visually.

1. **Header:** Product name, nav (New scan, Scheduled), optional “Authorized testing only” line.
2. **Left column — Configure scan:** Target input, module toggles, schedule, email for recurring, **consent** checkbox, Launch.
3. **Right column — Dashboard:** History list, active scan detail, risk gauge, findings cards, compare panel, export/delete.
4. **Finding card actions:** Explain (AI), severity badge, remediation block.
5. **Empty state:** Prompt to run first scan; short hint on API path for developers.

---

## 8. Non-functional requirements

| Area | Requirement |
|------|--------------|
| **Performance** | Scan duration depends on target; UI must stay responsive (async jobs + SSE). |
| **Accessibility** | Focus states, dialog labels, readable contrast (Tailwind-friendly). |
| **Security** | Secrets in env only; optional API auth; no secrets in client bundle except public `VITE_API_KEY` when required. |
| **Privacy** | Clear statement on what is logged (consent time, IP, findings JSON). |

---

## 9. Brand & tone guidelines

- **Voice:** Confident, precise, educational—not alarmist, not “hacker movie” hype.
- **Visual keywords:** Dark UI, cyan/teal accents, monospace for targets/IDs, subtle grid or glow (current direction).
- **Avoid:** Stock “matrix” clichés; implying illegal use.

---

## 10. Metrics (if productized later)

- Time to first completed scan.
- % scans with at least one “high/critical” finding (internal analytics only).
- Export usage (PDF vs CSV).

---

## 11. Open design questions (for your AI design pass)

1. **Split** marketing landing vs app: same domain with `/` + `/app`, or subdomain?
2. **Illustrations:** Abstract network diagrams vs minimal iconography?
3. **Dark-only vs light mode** for accessibility and print?
4. **Demo mode:** Pre-filled safe target or animated mock (no real scans)?

---

*This PRD reflects the Sentinel / vulnerability-scanner codebase as of the hackathon implementation. Adjust naming and routes to match your final IA.*
