/**
 * API origin with no trailing slash.
 *
 * Default: "" so browser requests hit `/api/...` on the current host
 * (Vite dev proxy locally).
 *
 * Override: set VITE_API_URL to call a different backend origin.
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const v = typeof raw === "string" ? raw.trim() : "";
  return v ? v.replace(/\/$/, "") : "";
}

/** Normalize FastAPI `detail` (string | array | object) for UI messages. */
export function formatApiErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((x) => {
        const msg = x.msg || x.message || JSON.stringify(x);
        const loc = Array.isArray(x.loc) ? x.loc.filter((p) => p !== "body").join(".") : "";
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join("; ");
  }
  return String(detail);
}

/** Error text for a failed fetch to the API (handles HTML 404 pages from static hosts). */
export async function readFetchError(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    const msg = formatApiErrorDetail(data.detail);
    if (msg) return msg;
  }
  if (res.status === 404) {
    return "API not found on this host. Ensure the backend is running and the dev proxy is configured, or set VITE_API_URL.";
  }
  return res.statusText || `Error ${res.status}`;
}

/** No auth headers are required (authentication disabled). */
export function authHeaders(extra = {}) {
  return { ...extra };
}

/** URL for SSE. */
export function scanEventsUrl(scanId) {
  return `${getApiBase()}/api/scans/${encodeURIComponent(scanId)}/events`;
}

function detailMessage(detail) {
  const s = formatApiErrorDetail(detail);
  return s || "Request failed";
}

export async function postScan(body) {
  const res = await fetch(`${getApiBase()}/api/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function getHistory(target) {
  const q = new URLSearchParams({ target });
  const res = await fetch(`${getApiBase()}/api/scans/history?${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function getScan(scanId) {
  const res = await fetch(`${getApiBase()}/api/scans/${scanId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function listScans() {
  const res = await fetch(`${getApiBase()}/api/scans`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteScan(scanId) {
  const res = await fetch(`${getApiBase()}/api/scans/${encodeURIComponent(scanId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
}

export async function exportScan(scanId, format) {
  const q = format === "csv" ? "?format=csv" : "?format=json";
  const res = await fetch(`${getApiBase()}/api/scans/${encodeURIComponent(scanId)}/export${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}

export async function getCompare(leftId, rightId) {
  const q = new URLSearchParams({ left: leftId, right: rightId });
  const res = await fetch(`${getApiBase()}/api/scans/compare?${q}`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function postExplain(finding, targetHint = "") {
  const res = await fetch(`${getApiBase()}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ finding, target_hint: targetHint }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function postBatchExplain(findings, targetHint) {
  const res = await fetch(`${getApiBase()}/api/batch-explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ findings, target_hint: targetHint }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function listScheduledScans() {
  const res = await fetch(`${getApiBase()}/api/scheduled-scans`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function patchScheduledScan(jobId, enabled) {
  const res = await fetch(`${getApiBase()}/api/scheduled-scans/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteScheduledScan(jobId) {
  const res = await fetch(`${getApiBase()}/api/scheduled-scans/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
}

export async function runScheduledNow(jobId) {
  const res = await fetch(`${getApiBase()}/api/scheduled-scans/${encodeURIComponent(jobId)}/run`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function downloadReportBlob(scanId) {
  const res = await fetch(`${getApiBase()}/api/scans/${encodeURIComponent(scanId)}/report`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}

export async function getEpss(cveId) {
  const res = await fetch(`${getApiBase()}/api/epss?cve=${encodeURIComponent(cveId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function postAttackPath(finding) {
  const res = await fetch(`${getApiBase()}/api/attack-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(finding),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
