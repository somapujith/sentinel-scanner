import { useEffect, useReducer } from "react";
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

const initialState = {
  scan: null,
  history: [],
  err: "",
  severityFilter: "all",
  exportBusy: false,
  deleteBusy: false,
  
  // Compare State
  compareLeft: "",
  compareRight: "",
  compareResult: null,
  compareErr: "",
  compareLoading: false,

  // Explain State
  explainOpen: false,
  explainFinding: null,
  explainLoading: false,
  explainText: "",
  explainSource: "local",
  explainErr: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SCAN":
      return { ...state, scan: action.payload, err: "" };
    case "UPDATE_SCAN_STATUS":
      return { ...state, scan: state.scan ? { ...state.scan, status: action.payload } : null };
    case "SET_ERROR":
      return { ...state, err: action.payload };
    case "SET_HISTORY":
      return { ...state, history: action.payload };
    case "SET_SEVERITY_FILTER":
      return { ...state, severityFilter: action.payload };
    case "SET_EXPORT_BUSY":
      return { ...state, exportBusy: action.payload };
    case "SET_DELETE_BUSY":
      return { ...state, deleteBusy: action.payload };
      
    // Compare Actions
    case "SET_COMPARE_SELECTION":
      return { ...state, compareLeft: action.payload.left, compareRight: action.payload.right };
    case "SET_COMPARE_LEFT":
      return { ...state, compareLeft: action.payload };
    case "SET_COMPARE_RIGHT":
      return { ...state, compareRight: action.payload };
    case "COMPARE_START":
      return { ...state, compareLoading: true, compareErr: "", compareResult: null };
    case "COMPARE_SUCCESS":
      return { ...state, compareLoading: false, compareResult: action.payload };
    case "COMPARE_ERROR":
      return { ...state, compareLoading: false, compareErr: action.payload };
      
    // Explain Actions
    case "EXPLAIN_START":
      return {
        ...state,
        explainOpen: true,
        explainFinding: action.payload,
        explainLoading: true,
        explainText: "",
        explainErr: "",
      };
    case "EXPLAIN_SUCCESS":
      return {
        ...state,
        explainLoading: false,
        explainText: action.payload.explanation,
        explainSource: action.payload.source,
      };
    case "EXPLAIN_ERROR":
      return { ...state, explainLoading: false, explainErr: action.payload };
    case "EXPLAIN_CLOSE":
      return { ...state, explainOpen: false, explainFinding: null };
      
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    scan, history, err, severityFilter, exportBusy, deleteBusy,
    compareLeft, compareRight, compareResult, compareErr, compareLoading,
    explainOpen, explainFinding, explainLoading, explainText, explainSource, explainErr
  } = state;

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

  // Load History
  useEffect(() => {
    listScans()
      .then((data) => dispatch({ type: "SET_HISTORY", payload: data }))
      .catch(() => dispatch({ type: "SET_HISTORY", payload: [] }));
  }, [scanId, scan?.status]);

  // Handle EventSource connection and basic polling
  useEffect(() => {
    if (!scanId) {
      dispatch({ type: "SET_SCAN", payload: null });
      return;
    }

    let cancelled = false;
    let es = null;

    dispatch({ type: "SET_SCAN", payload: null });
    dispatch({ type: "SET_ERROR", payload: "" });

    const fetchScanData = async () => {
      try {
        const data = await getScan(scanId);
        if (!cancelled) {
          dispatch({ type: "SET_SCAN", payload: data });
        }
      } catch (e) {
        if (!cancelled) {
          dispatch({ type: "SET_ERROR", payload: e.message || "Failed to load scan" });
        }
      }
    };

    fetchScanData();
    const id = setInterval(fetchScanData, 2500);

    const setupEventSource = () => {
      try {
        const url = scanEventsUrl(scanId);
        es = new EventSource(url);
        
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.error) {
              es?.close();
              return;
            }
            dispatch({ type: "UPDATE_SCAN_STATUS", payload: data.status });
            
            const st = data.status || "";
            if (st === "complete" || String(st).startsWith("failed")) {
              if (st === "complete") toast.success("Scan complete!");
              else toast.error("Scan failed to complete.");
              
              es?.close();
              // Do one final fetch
              fetchScanData();
            }
          } catch {
             // parsing err
          }
        };

        es.onerror = () => {
           es?.close();
        };
      } catch {
         // es init err
      }
    };

    setupEventSource();

    return () => {
      cancelled = true;
      clearInterval(id);
      if (es) {
        es.close();
      }
    };
  }, [scanId]);

  // Set initial compare selections
  useEffect(() => {
    if (history.length >= 2 && !compareLeft && !compareRight) {
      dispatch({
        type: "SET_COMPARE_SELECTION",
        payload: { left: history[0].id, right: history[1].id }
      });
    }
  }, [history, compareLeft, compareRight]);

  const runCompare = async () => {
    if (!compareLeft || !compareRight || compareLeft === compareRight) {
      dispatch({ type: "COMPARE_ERROR", payload: "Pick two different scans." });
      return;
    }
    dispatch({ type: "COMPARE_START" });
    try {
      const data = await getCompare(compareLeft, compareRight);
      dispatch({ type: "COMPARE_SUCCESS", payload: data });
    } catch (e) {
      dispatch({ type: "COMPARE_ERROR", payload: e.message || "Compare failed" });
      toast.error("Compare failed: " + (e.message || "Unknown error"));
    }
  };

  const downloadExport = async (format) => {
    if (!scanId || exportBusy) return;
    dispatch({ type: "SET_EXPORT_BUSY", payload: true });
    try {
      const blob = await exportScan(scanId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-${scanId.slice(0, 8)}.${format === "csv" ? "csv" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed: " + (e.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_EXPORT_BUSY", payload: false });
    }
  };

  const handleDelete = async () => {
    if (!scanId || deleteBusy) return;
    const ok = window.confirm("Delete this scan permanently?");
    if (!ok) return;

    dispatch({ type: "SET_DELETE_BUSY", payload: true });
    try {
      await deleteScan(scanId);
      toast.success("Scan deleted");
      if (onScanDeleted) {
        onScanDeleted(scanId); // Navigate back to new scan
      }
    } catch (e) {
      toast.error("Delete failed: " + (e.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_DELETE_BUSY", payload: false });
    }
  };

  const handleExplain = async (finding) => {
    dispatch({ type: "EXPLAIN_START", payload: finding });
    try {
      const data = await postExplain(finding, scan?.target);
      dispatch({ type: "EXPLAIN_SUCCESS", payload: data });
    } catch (e) {
      const errorMsg = e.message || "Explanation failed";
      dispatch({ type: "EXPLAIN_ERROR", payload: errorMsg });
      toast.error("Explanation failed: " + errorMsg);
    }
  };

  const handleExplainAll = async () => {
    if (!scan?.findings?.length) return;
    const batchFinding = { type: "batch", title: "All Findings Summary" };
    dispatch({ type: "EXPLAIN_START", payload: batchFinding });
    try {
      const data = await postBatchExplain(scan.findings, scan.target);
      dispatch({ type: "EXPLAIN_SUCCESS", payload: data });
    } catch (e) {
      const errorMsg = e.message || "Batch explanation failed";
      dispatch({ type: "EXPLAIN_ERROR", payload: errorMsg });
      toast.error("Batch explanation failed: " + errorMsg);
    }
  };

  if (!scanId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="mb-4 rounded-full bg-surface-800/50 p-4 ring-1 ring-white/10">
          <Activity className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100">No scan selected</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Enter a domain or IP address in the sidebar to start a new deep-dive vulnerability scan.
        </p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-8">
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-rose-500/5 ring-rose-500/20">
          <ShieldAlert className="mb-4 h-10 w-10 text-rose-400" />
          <h2 className="text-lg font-semibold text-rose-100">Failed to load footprint</h2>
          <p className="mt-2 text-sm text-rose-300/80">{err}</p>
        </Card>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-8">
        <ScanSkeleton />
      </div>
    );
  }

  const { target, status, updated_at, findings, aggregate_cvss } = scan;
  const inProgress = status === "running" || status.startsWith("running:") || status === "queued";
  
  const filteredFindings = findings?.filter((f) => {
    if (severityFilter === "all") return true;
    return (f.risk || "info").toLowerCase() === severityFilter;
  });

  const highCount = findings?.filter(f => ["critical", "high"].includes((f.risk || "low").toLowerCase())).length || 0;

  return (
    <div className="relative isolate px-6 py-8 pb-32">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:-top-80">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-[0.08]" />
      </div>

      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-in slide-in-from-bottom-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">{target}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1.5"><Inbox className="h-4 w-4" /> UUID: <span className="font-mono text-slate-300">{scanId.split("-")[0]}</span></span>
            <span className="flex items-center gap-1.5">Updated: <span className="text-slate-300">{new Date(updated_at).toLocaleTimeString()}</span></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExplainAll()}
            disabled={explainLoading || inProgress || !findings?.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600/10 px-4 py-2.5 text-sm font-semibold text-orange-400 shadow-sm ring-1 ring-inset ring-orange-500/20 hover:bg-orange-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" /> Explain Output
          </button>
          <ReportDownload
            scanId={scanId}
            onExport={downloadExport}
            busy={exportBusy}
            disabled={inProgress}
          />
          <button
            onClick={handleDelete}
            disabled={deleteBusy}
            className="inline-flex items-center justify-center rounded-xl bg-surface-800 p-2.5 text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {deleteBusy ? <Activity className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {inProgress && (
         <Card className="mb-8 p-6 bg-surface-800/40 ring-indigo-500/10 animate-in fade-in">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
               <Activity className="h-4 w-4 animate-pulse" /> Scanning Engine Active
             </h3>
             <span className="text-xs font-mono text-slate-500">{status}</span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
             {MODULE_STEPS.map((mod) => {
               const st = getModuleStepState(mod, status);
               return (
                 <div key={mod} className="flex flex-col gap-1.5">
                   <div className="h-1.5 w-full rounded-full bg-surface-900 overflow-hidden">
                     {st === "done" && <div className="h-full bg-emerald-500 w-full" />}
                     {st === "active" && <div className="h-full bg-indigo-500 animate-[progress_1s_infinite]" style={{width: '60%'}} />}
                   </div>
                   <span className={cn(
                     "text-[10px] font-medium uppercase tracking-wider",
                     st === "done" ? "text-emerald-400" : st === "active" ? "text-indigo-400" : "text-slate-600"
                   )}>{MODULE_LABELS[mod] || mod}</span>
                 </div>
               )
             })}
           </div>
         </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 animate-in slide-in-from-bottom-4 duration-500 delay-100">
        <RiskGauge score={aggregate_cvss || 0.0} label="Security Score" status={status} />
        
        <Card className="flex flex-col p-6 bg-surface-800/40 hover:bg-surface-800/60 transition-colors group">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-semibold">High Priority</h3>
          </div>
          <div className="mt-auto">
            <span className="text-5xl font-black tracking-tighter text-white group-hover:text-rose-100 transition-colors">{inProgress ? "-" : highCount}</span>
            <p className="text-sm font-medium text-slate-400 mt-1">Exposures require attention</p>
          </div>
        </Card>

        <Card className="flex flex-col p-6 bg-surface-800/40 hover:bg-surface-800/60 transition-colors">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <GitCompare className="h-5 w-5" />
            <h3 className="font-semibold">Compare Profile</h3>
          </div>
          <div className="mt-auto space-y-2">
             <select
              value={compareLeft}
              onChange={(e) => dispatch({ type: "SET_COMPARE_LEFT", payload: e.target.value })}
              className="w-full text-xs bg-surface-900 border border-white/5 rounded p-1.5 text-slate-300"
            >
              <option value="">Baseline...</option>
              {history.map((s) => (
                <option key={s.id} value={s.id}>{s.id.slice(0,6)} : {s.target}</option>
              ))}
            </select>
            <select
              value={compareRight}
              onChange={(e) => dispatch({ type: "SET_COMPARE_RIGHT", payload: e.target.value })}
              className="w-full text-xs bg-surface-900 border border-white/5 rounded p-1.5 text-slate-300"
            >
              <option value="">Target...</option>
              {history.map((s) => (
                <option key={s.id} value={s.id}>{s.id.slice(0,6)} : {s.target}</option>
              ))}
            </select>
            <button
              onClick={runCompare}
              disabled={compareLoading || history.length < 2}
              className="w-full mt-2 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs rounded border border-indigo-500/20 font-medium cursor-pointer"
            >
              {compareLoading ? "Running Diff..." : "Generate Diff"}
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <FileJson2 className="h-5 w-5 text-indigo-400" />
               Identified Payloads
             </h2>
             <div className="ml-auto inline-flex rounded-md bg-surface-900 p-1 ring-1 ring-white/5">
                {SEVERITY_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => dispatch({ type: "SET_SEVERITY_FILTER", payload: tab })}
                    className={cn(
                      "rounded px-3 py-1 text-xs font-semibold capitalize transition-all",
                      severityFilter === tab ? "bg-surface-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {tab}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex flex-col gap-3 min-h-[400px] border border-white/5 rounded-2xl p-4 bg-surface-800/10">
            {!findings?.length && !inProgress && (
              <div className="text-center py-20 text-slate-400 text-sm">
                No payloads detected for this footprint.
              </div>
            )}
            
            {filteredFindings?.map((f, i) => (
              <VulnCard 
                key={i} 
                finding={f} 
                onExplain={() => handleExplain(f)}
                disabled={inProgress}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <TrendChart target={target} />
           
           {compareResult && (
              <Card className="p-5 bg-surface-800/40 ring-1 ring-indigo-500/20">
                 <h3 className="font-bold text-sm text-indigo-300 mb-3 border-b border-white/5 pb-2">Diff Analysis</h3>
                 <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                       <span>Score Delta:</span>
                       <span className={compareResult.health_delta > 0 ? "text-emerald-400" : "text-rose-400"}>
                          {compareResult.health_delta > 0 ? "+" : ""}{compareResult.health_delta ? compareResult.health_delta.toFixed(1) : 0}
                       </span>
                    </div>
                    {compareResult.new_findings?.length > 0 && (
                      <div className="mt-4">
                         <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider block mb-1">New Vectors</span>
                         <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                           {compareResult.new_findings.slice(0,3).map((nf, idx) => (
                             <li key={idx}>{nf.title || nf.type}</li>
                           ))}
                         </ul>
                      </div>
                    )}
                 </div>
              </Card>
           )}
        </div>
      </div>

      <FindingDrawer
        open={explainOpen}
        onClose={() => dispatch({ type: "EXPLAIN_CLOSE" })}
        finding={explainFinding}
        loading={explainLoading}
        explanation={explainText}
        source={explainSource}
        error={explainErr}
        target={target}
      />
    </div>
  );
}
