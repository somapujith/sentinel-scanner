import { useEffect, useState } from "react";
import {
  Activity,
  ChevronRight,
  FileJson2,
  GitCompare,
  History,
  Inbox,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { deleteScan, exportScan, getCompare, getScan, listScans, postExplain, scanEventsUrl } from "../api.js";
import { cn } from "../lib/cn.js";
import FindingDrawer from "./FindingDrawer.jsx";
import ReportDownload from "./ReportDownload.jsx";
import RiskGauge from "./RiskGauge.jsx";
import StatusBadge from "./StatusBadge.jsx";
import VulnCard from "./VulnCard.jsx";
import { Card } from "./ui/Card.jsx";

function ScanSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-2xl bg-surface-800/80 ring-1 ring-white/[0.04]" />
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="h-48 rounded-2xl bg-surface-800/80 ring-1 ring-white/[0.04]" />
        <div className="space-y-3">
          <div className="h-28 rounded-xl bg-surface-800/60 ring-1 ring-white/[0.04]" />
          <div className="h-28 rounded-xl bg-surface-800/60 ring-1 ring-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ scanId, onSelectScan, onScanDeleted }) {
  const [scan, setScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [compareLeft, setCompareLeft] = useState("");
  const [compareRight, setCompareRight] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareErr, setCompareErr] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainFinding, setExplainFinding] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainSource, setExplainSource] = useState("local");
  const [explainErr, setExplainErr] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    listScans()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [scanId, scan?.status]);

  useEffect(() => {
    if (!scanId) {
      setScan(null);
      return;
    }

    setScan(null);
    setErr("");
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await getScan(scanId);
        if (!cancelled) {
          setScan(data);
          setErr("");
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load scan");
      }
    };

    tick();
    const id = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [scanId]);

  useEffect(() => {
    if (!scanId) return;
    const url = scanEventsUrl(scanId);
    let es;
    try {
      es = new EventSource(url);
    } catch {
      return;
    }
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.error) {
          es.close();
          return;
        }
        setScan((prev) => (prev ? { ...prev, status: data.status } : prev));
        const st = data.status || "";
        if (st === "complete" || String(st).startsWith("failed")) {
          es.close();
          getScan(scanId)
            .then(setScan)
            .catch(() => {});
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      try {
        es.close();
      } catch {
        /* ignore */
      }
    };
    return () => {
      try {
        es.close();
      } catch {
        /* ignore */
      }
    };
  }, [scanId]);

  useEffect(() => {
    if (history.length >= 2 && !compareLeft && !compareRight) {
      setCompareLeft(history[0].id);
      setCompareRight(history[1].id);
    }
  }, [history, compareLeft, compareRight]);

  const runCompare = async () => {
    if (!compareLeft || !compareRight || compareLeft === compareRight) {
      setCompareErr("Pick two different scans.");
      return;
    }
    setCompareLoading(true);
    setCompareErr("");
    setCompareResult(null);
    try {
      const data = await getCompare(compareLeft, compareRight);
      setCompareResult(data);
    } catch (e) {
      setCompareErr(e.message || "Compare failed");
    } finally {
      setCompareLoading(false);
    }
  };

  const downloadExport = async (format) => {
    if (!scanId || exportBusy) return;
    setExportBusy(true);
    try {
      const blob = await exportScan(scanId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-${scanId.slice(0, 8)}.${format === "csv" ? "csv" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setExportBusy(false);
    }
  };

  const handleDeleteScan = async () => {
    if (!scanId || deleteBusy) return;
    if (!window.confirm("Delete this scan and all its findings? This cannot be undone.")) return;
    setDeleteBusy(true);
    try {
      await deleteScan(scanId);
      onScanDeleted?.();
    } catch {
      /* ignore */
    } finally {
      setDeleteBusy(false);
    }
  };

  const openExplain = (finding) => {
    setExplainFinding(finding);
    setExplainOpen(true);
    setExplainText("");
    setExplainErr("");
    setExplainLoading(true);
    postExplain(finding, scan?.target || "")
      .then((r) => {
        setExplainText(r.explanation || "");
        setExplainSource(r.source || "local");
      })
      .catch((e) => setExplainErr(e.message || "Explain failed"))
      .finally(() => setExplainLoading(false));
  };

  const complete = scan?.status === "complete";
  const running = scan && !complete && !String(scan.status || "").startsWith("failed");
  const showSkeleton = Boolean(scanId) && !scan && !err;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-8">
      <aside className="animate-fade-in lg:sticky lg:top-[5.25rem] lg:self-start">
        <Card padding="p-0" className="overflow-hidden ring-1 ring-slate-800/40">
          <div className="border-b border-slate-800/60 bg-slate-900/30 px-4 py-3">
            <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <History className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              History
            </h3>
          </div>
          <ul className="max-h-[min(420px,50vh)] overflow-y-auto p-2">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onSelectScan(h.id)}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all",
                    h.id === scanId
                      ? "bg-cyan-500/12 ring-1 ring-cyan-500/30"
                      : "hover:bg-slate-800/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-xs text-slate-300">{h.target}</div>
                    <div className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-slate-600">{h.status}</div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-400/80",
                      h.id === scanId && "text-cyan-400/70",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
          {history.length === 0 && (
            <p className="px-4 pb-4 text-center text-xs text-slate-600">No scans yet. Run one to populate this list.</p>
          )}
        </Card>
      </aside>

      <section className="min-w-0 space-y-6">
        {!scanId && (
          <Card className="animate-fade-in flex flex-col items-center justify-center border-dashed border-slate-700/50 bg-surface-900/25 py-14 text-center ring-0 sm:py-16">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/40 ring-1 ring-slate-700/50">
              <Inbox className="h-7 w-7 text-slate-500" strokeWidth={1.25} aria-hidden />
            </div>
            <p className="max-w-md px-2 text-sm leading-relaxed text-slate-400">
              Run your first scan from the left panel. Results stream here from{" "}
              <code className="rounded-md border border-slate-700/50 bg-surface-800/80 px-1.5 py-0.5 font-mono text-xs text-cyan-400/95">
                GET /api/scans/:id
              </code>
              .
            </p>
            <p className="mt-4 max-w-md px-2 text-xs leading-relaxed text-slate-500">
              Developers: enable optional API keys in server env for scripted{" "}
              <code className="font-mono text-[10px] text-slate-500">/api/*</code> access (see Docs → Security).
            </p>
          </Card>
        )}

        {err && scanId && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-500/10">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden />
            <span>{err}</span>
          </div>
        )}

        {showSkeleton && <ScanSkeleton />}

        {scan && !showSkeleton && (
          <div className="animate-fade-in space-y-6">
            <Card className="ring-1 ring-slate-800/45">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active target</span>
                    <StatusBadge status={scan.status} />
                  </div>
                  <p className="break-all font-mono text-lg font-medium text-white sm:text-xl">{scan.target}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-cyan-500/80" />
                      {running ? "Live status via SSE + polling" : complete ? "Scan finished" : "Processing"}
                    </span>
                    {running && (
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-slate-800">
                        <span className="block h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent bg-[length:200%_100%]" />
                      </span>
                    )}
                  </div>
                  {(scan.consent_at || (scan.modules || []).length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      {scan.consent_at && (
                        <span>
                          Consent logged{" "}
                          <time dateTime={scan.consent_at}>{new Date(scan.consent_at).toLocaleString()}</time>
                          {scan.consent_ip ? ` · IP ${scan.consent_ip}` : ""}
                        </span>
                      )}
                      {(scan.modules || []).length > 0 && (
                        <span className="font-mono">Modules: {(scan.modules || []).join(", ")}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <ReportDownload scanId={scanId} complete={complete} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={!complete || exportBusy}
                      onClick={() => downloadExport("json")}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      disabled={!complete || exportBusy}
                      onClick={() => downloadExport("csv")}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      disabled={deleteBusy}
                      onClick={handleDeleteScan}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete scan
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr] xl:grid-cols-[minmax(0,280px)_1fr]">
              <RiskGauge score={scan.aggregate_cvss ?? 0} />
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight text-white">Findings</h3>
                  <span className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-slate-500">
                    {(scan.findings || []).length} items
                  </span>
                </div>
                <div className="space-y-3">
                  {(scan.findings || []).map((f, i) => (
                    <VulnCard key={`${f.type}-${i}`} finding={f} onExplain={openExplain} />
                  ))}
                  {complete && (scan.findings || []).length === 0 && (
                    <Card className="border-dashed border-white/10 bg-transparent py-10 text-center ring-0">
                      <FileJson2 className="mx-auto mb-2 h-8 w-8 text-slate-600" aria-hidden />
                      <p className="text-sm text-slate-500">No findings for this run.</p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {history.length >= 2 && (
          <Card className="animate-fade-in ring-1 ring-slate-800/45">
            <div className="mb-4 flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-cyan-400/80" aria-hidden />
              <h3 className="text-sm font-semibold tracking-tight text-white">Compare scans</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Left (baseline)
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-surface-900/90 px-3 text-xs text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  value={compareLeft}
                  onChange={(e) => setCompareLeft(e.target.value)}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.target.slice(0, 48)}
                      {h.target.length > 48 ? "…" : ""} — {h.id.slice(0, 8)}…
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Right (newer)
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-surface-900/90 px-3 text-xs text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  value={compareRight}
                  onChange={(e) => setCompareRight(e.target.value)}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.target.slice(0, 48)}
                      {h.target.length > 48 ? "…" : ""} — {h.id.slice(0, 8)}…
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={runCompare}
                disabled={compareLoading}
                className="h-10 shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/15 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
              >
                {compareLoading ? "Comparing…" : "Compare"}
              </button>
            </div>
            {compareErr && (
              <p className="mt-3 text-sm text-rose-400" role="alert">
                {compareErr}
              </p>
            )}
            {compareResult && (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-xs text-slate-500">
                  <span className="font-mono text-slate-400">{compareResult.left_target}</span>
                  {" vs "}
                  <span className="font-mono text-slate-400">{compareResult.right_target}</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["Only left", compareResult.counts?.only_left],
                    ["Only right", compareResult.counts?.only_right],
                    ["Unchanged", compareResult.counts?.unchanged],
                  ].map(([label, n]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.06] bg-surface-900/50 px-3 py-2 text-center"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                      <div className="font-mono text-lg text-white">{n ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <FindingDrawer
          open={explainOpen}
          title={explainFinding?.title || explainFinding?.type || ""}
          loading={explainLoading}
          explanation={explainText}
          source={explainSource}
          error={explainErr}
          onClose={() => {
            setExplainOpen(false);
            setExplainFinding(null);
          }}
        />
      </section>
    </div>
  );
}
