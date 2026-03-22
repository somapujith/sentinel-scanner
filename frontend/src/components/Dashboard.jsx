import { useEffect, useState } from "react";
import {
  Activity,
  FileJson2,
  GitCompare,
  Inbox,
  ShieldAlert,
  Trash2,
  Play,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteScan, exportScan, getCompare, getScan, listScans, postExplain, postBatchExplain, scanEventsUrl } from "../api.js";
import { cn } from "../lib/cn.js";
import FindingDrawer from "./FindingDrawer.jsx";
import ReportDownload from "./ReportDownload.jsx";
import RiskGauge from "./RiskGauge.jsx";
import StatusBadge from "./StatusBadge.jsx";
import TrendChart from "./TrendChart.jsx";
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
  const [severityFilter, setSeverityFilter] = useState("all");

  const SEVERITY_TABS = ["all", "critical", "high", "medium", "low", "info"];
  const MODULE_STEPS = ["port", "dns", "subdomain", "header", "ssl", "cors", "inject"];
  const MODULE_LABELS = { 
    port: "Ports", 
    dns: "DNS",
    subdomain: "Subdomains",
    header: "Headers", 
    ssl: "TLS/SSL",
    cors: "CORS",
    inject: "Reflection" 
  };

  function getModuleStepState(modId, status) {
    if (!status || status === "complete") return "done";
    const active = status.startsWith("running:") ? status.split(":")[1] : null;
    const activeIdx = MODULE_STEPS.indexOf(active);
    const idx = MODULE_STEPS.indexOf(modId);
    if (activeIdx === -1) return "pending";
    if (idx < activeIdx) return "done";
    if (idx === activeIdx) return "active";
    return "pending";
  }

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
          if (st === "complete") {
            toast.success("Scan complete!");
          } else {
            toast.error("Scan failed to complete.");
          }
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

  const handleRescan = async () => {
    if (!scan) return;
    try {
      const { postScan } = await import("../api.js");
      const res = await postScan({ target: scan.target, modules: scan.modules || [], consent: true });
      toast.success("Rescan started");
      window.location.hash = `#/app/${res.scan_id}`;
    } catch (e) {
      toast.error(e.message || "Failed to start rescan");
    }
  };

  const handleShare = () => {
    if (!scanId) return;
    const url = `${window.location.origin}/#/app/${scanId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
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

  const handleBatchExplain = () => {
    const findings = scan?.findings || [];
    const severe = findings.filter(f => (f.risk || "").toLowerCase() === "critical" || (f.risk || "").toLowerCase() === "high").slice(0, 5);
    
    if (severe.length === 0) {
      toast.info("No critical or high findings found to summarize.");
      return;
    }
    
    setExplainFinding({
      title: "Batch Executive Summary",
      type: "batch_summary",
      risk: "info",
      cvss: 0,
      description: `Generating executive summary for ${severe.length} high-severity findings...`
    });
    setExplainOpen(true);
    setExplainText("");
    setExplainErr("");
    setExplainLoading(true);
    
    postBatchExplain(severe, scan?.target || "")
      .then((r) => {
        setExplainText(r.explanation || "");
        setExplainSource(r.source || "local");
      })
      .catch((e) => setExplainErr(e.message || "Batch explain failed"))
      .finally(() => setExplainLoading(false));
  };

  const complete = scan?.status === "complete";
  const running = scan && !complete && !String(scan.status || "").startsWith("failed");
  const showSkeleton = Boolean(scanId) && !scan && !err;

  const filteredFindings = (scan?.findings || []).filter((f) => {
    if (severityFilter === "all") return true;
    return (f.risk || "").toLowerCase() === severityFilter;
  });

  return (
    <section className="min-w-0 space-y-6">
        {!scanId && (
          <Card className="animate-fade-in relative flex flex-col items-center justify-center overflow-hidden border border-white/[0.04] bg-white/[0.01] py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_50%)]" aria-hidden />
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent ring-1 ring-white/[0.08] shadow-[0_0_24px_-4px_rgba(220,38,38,0.15)]">
              <Inbox className="h-7 w-7 text-primary/80" strokeWidth={1.25} aria-hidden />
            </div>
            <p className="relative max-w-md px-2 text-[15px] font-medium leading-relaxed text-slate-300">
              Run your first scan from the configure panel. Results stream here from{" "}
              <code className="rounded-md border border-white/[0.06] bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-primary/95 shadow-inner">
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
                      <Activity className="h-3.5 w-3.5 text-primary/85" />
                      {running ? "Live status via SSE + polling" : complete ? "Scan finished" : "Processing"}
                    </span>
                    {running && (
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-slate-800">
                        <span className="block h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent bg-[length:200%_100%]" />
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
                  {/* Module progress bar - shown while scan is running */}
                  {running && (scan.modules || []).length > 0 && (
                    <div className="module-progress mt-3">
                      {MODULE_STEPS.filter(m => (scan.modules || []).includes(m)).map((m, i, arr) => {
                        const state = getModuleStepState(m, scan.status);
                        return (
                          <div key={m} className={`module-step module-step--${state}`}>
                            <span className="module-step__label">{MODULE_LABELS[m] || m}</span>
                            {i < arr.length - 1 && <span className="module-step__connector" />}
                          </div>
                        );
                      })}
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
                      onClick={handleRescan}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden />
                      Re-scan
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/25 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" aria-hidden />
                      Copy Link
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

            <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,260px)_1fr] xl:grid-cols-[minmax(0,280px)_1fr]">
              <div className="sticky top-6 flex flex-col gap-6">
                <RiskGauge score={scan.aggregate_cvss ?? 0} status={scan.status} />
                <TrendChart target={scan.target} />
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold tracking-tight text-white">Findings</h3>
                    {complete && (scan?.findings || []).some(f => (f.risk || "").toLowerCase() === "critical" || (f.risk || "").toLowerCase() === "high") && (
                      <button
                        type="button"
                        onClick={handleBatchExplain}
                        className="inline-flex items-center gap-1.5 rounded bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 ring-1 ring-blue-500/30"
                      >
                        <Activity className="h-3 w-3" />
                        AI Summary
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Severity filter tabs */}
                    <div className="flex flex-wrap gap-1">
                      {SEVERITY_TABS.map((s) => {
                        const count = s === "all" ? (scan.findings || []).length
                          : (scan.findings || []).filter(f => (f.risk || "").toLowerCase() === s).length;
                        if (s !== "all" && count === 0) return null;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSeverityFilter(s)}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                              severityFilter === s
                                ? s === "all" ? "bg-white/[0.08] text-white"
                                : s === "critical" ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30"
                                : s === "high" ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25"
                                : s === "medium" ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                                : s === "low" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                                : "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/25"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                            )}
                          >
                            {s} {s !== "all" && <span className="opacity-60">({count})</span>}
                          </button>
                        );
                      })}
                    </div>
                    <span className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-slate-500">
                      {filteredFindings.length}/{(scan.findings || []).length}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredFindings.map((f, i) => (
                    <VulnCard key={`${f.type}-${i}`} finding={f} onExplain={openExplain} />
                  ))}
                  {complete && filteredFindings.length === 0 && (
                    <Card className="border-dashed border-white/10 bg-transparent py-10 text-center ring-0">
                      <FileJson2 className="mx-auto mb-2 h-8 w-8 text-slate-600" aria-hidden />
                      <p className="text-sm text-slate-500">{severityFilter === "all" ? "No findings for this run." : `No ${severityFilter} findings.`}</p>
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
              <GitCompare className="h-4 w-4 text-primary/85" aria-hidden />
              <h3 className="text-sm font-semibold tracking-tight text-white">Compare scans</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Left (baseline)
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 text-xs font-medium text-slate-200 shadow-inner focus:border-primary/45 focus:bg-white/[0.02] focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
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
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Right (newer)
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 text-xs font-medium text-slate-200 shadow-inner focus:border-primary/45 focus:bg-white/[0.02] focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
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
                className="h-11 shrink-0 rounded-xl border border-primary/35 bg-gradient-to-r from-primary/10 to-primary/5 shadow-[0_4px_16px_-4px_rgba(220,38,38,0.25)] px-5 text-sm font-semibold text-white transition-all hover:border-primary/50 hover:from-primary/20 hover:to-primary/10 disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/45"
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
                
                <div className="mt-8 space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Detailed Differences</h4>
                  {compareResult.items_only_right?.map((f, i) => (
                    <VulnCard key={`new-${i}`} finding={f} defaultExpanded badge="NEW ISSUE" badgeColor="blue" />
                  ))}
                  {compareResult.items_only_left?.map((f, i) => (
                    <VulnCard key={`fixed-${i}`} finding={f} badge="FIXED" badgeColor="green" />
                  ))}
                  {compareResult.items_unchanged?.map((f, i) => (
                    <VulnCard key={`unchanged-${i}`} finding={f} badge="UNCHANGED" />
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
  );
}
