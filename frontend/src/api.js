const base = import.meta.env.VITE_API_URL || "";

/** Headers including JWT token from localStorage, or VITE_API_KEY for protected deployments. */
export function authHeaders(extra = {}) {
  const h = { ...extra };
  // Prefer JWT token from login session
  const jwt = localStorage.getItem("sentinel_token");
  if (jwt && !h["Authorization"]) {
    h["Authorization"] = `Bearer ${jwt}`;
  } else {
    // Fallback to static API key for deployments that use VITE_API_KEY
    const k = import.meta.env.VITE_API_KEY;
    if (k && !h["X-API-Key"] && !h.Authorization) {
      h["X-API-Key"] = k;
    }
  }
  return h;
}

/** URL for SSE. EventSource cannot send headers; `api_key` query is supported by the API when auth is required. */
export function scanEventsUrl(scanId) {
  let u = `${base}/api/scans/${encodeURIComponent(scanId)}/events`;
  const k = import.meta.env.VITE_API_KEY;
  if (k) {
    u += `${u.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(k)}`;
  }
  return u;
}

function detailMessage(detail) {
  if (!detail) return "Request failed";
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

export async function postScan(body) {
  const res = await fetch(`${base}/api/scans`, {
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
  const res = await fetch(`${base}/api/scans/history?${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function getScan(scanId) {
  const res = await fetch(`${base}/api/scans/${scanId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function listScans() {
  const res = await fetch(`${base}/api/scans`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteScan(scanId) {
  const res = await fetch(`${base}/api/scans/${encodeURIComponent(scanId)}`, {
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
  const res = await fetch(`${base}/api/scans/${encodeURIComponent(scanId)}/export${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}

export async function getCompare(leftId, rightId) {
  const q = new URLSearchParams({ left: leftId, right: rightId });
  const res = await fetch(`${base}/api/scans/compare?${q}`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(detailMessage(err.detail) || res.statusText);
  }
  return res.json();
}

export async function postExplain(finding, targetHint = "") {
  const res = await fetch(`${base}/api/explain`, {
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
  const res = await fetch(`${base}/api/batch-explain`, {
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
  const res = await fetch(`${base}/api/scheduled-scans`, { headers: authHeaders() });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function patchScheduledScan(jobId, enabled) {
  const res = await fetch(`${base}/api/scheduled-scans/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteScheduledScan(jobId) {
  const res = await fetch(`${base}/api/scheduled-scans/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
}

export async function runScheduledNow(jobId) {
  const res = await fetch(`${base}/api/scheduled-scans/${encodeURIComponent(jobId)}/run`, {
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
  const res = await fetch(`${base}/api/scans/${encodeURIComponent(scanId)}/report`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}

export async function getEpss(cveId) {
  const res = await fetch(`${base}/api/epss?cve=${encodeURIComponent(cveId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function postAttackPath(finding) {
  const res = await fetch(`${base}/api/attack-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(finding),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
