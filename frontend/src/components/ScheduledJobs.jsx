import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Play, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  deleteScheduledScan,
  listScheduledScans,
  patchScheduledScan,
  runScheduledNow,
} from "../api.js";
import { cn } from "../lib/cn.js";
import { Card, CardHeader } from "./ui/Card.jsx";

export default function ScheduledJobs({ onRunStarted }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setErr("");
    listScheduledScans()
      .then(setRows)
      .catch((e) => setErr(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id, enabled) => {
    setBusyId(id);
    try {
      const u = await patchScheduledScan(id, !enabled);
      setRows((prev) => prev.map((r) => (r.id === id ? u : r)));
    } catch (e) {
      setErr(e.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this scheduled job?")) return;
    setBusyId(id);
    try {
      await deleteScheduledScan(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setErr(e.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const runNow = async (id) => {
    setBusyId(id);
    try {
      const r = await runScheduledNow(id);
      onRunStarted?.(r.scan_id);
    } catch (e) {
      setErr(e.message || "Run failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="ring-1 ring-white/[0.06]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary/85" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-white">Scheduled scans</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Jobs created when you choose daily or weekly on a scan. Disable, delete, or run one immediately.
        </p>
      </CardHeader>
      {err && (
        <p className="mb-4 text-sm text-rose-400" role="alert">
          {err}
        </p>
      )}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600">No recurring jobs yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-surface-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm text-slate-200">{r.target}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="uppercase tracking-wide">{r.schedule}</span>
                  <span>
                    Next:{" "}
                    <time dateTime={r.next_run_at}>{new Date(r.next_run_at).toLocaleString()}</time>
                  </span>
                  <span className="font-mono">{(r.modules || []).join(", ")}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(r.id, r.enabled)}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] disabled:opacity-50"
                  aria-pressed={r.enabled}
                >
                  {r.enabled ? (
                    <ToggleRight className="h-4 w-4 text-emerald-400/90" aria-hidden />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-slate-500" aria-hidden />
                  )}
                  {r.enabled ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  onClick={() => runNow(r.id)}
                  disabled={busyId === r.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-primary/18 disabled:opacity-50",
                  )}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Run now
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
