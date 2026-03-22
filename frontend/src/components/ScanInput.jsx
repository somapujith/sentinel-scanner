import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Crosshair,
  FileSearch,
  Loader2,
  Lock,
  Mail,
  Network,
  Play,
  Sparkles,
  Syringe,
} from "lucide-react";
import { postScan } from "../api.js";
import { cn } from "../lib/cn.js";
import { Card, CardHeader } from "./ui/Card.jsx";

const MODULE_ICONS = {
  port: Network,
  header: FileSearch,
  ssl: Lock,
  inject: Syringe,
};

const MODULES = [
  { id: "port", label: "Port scan", desc: "TCP connect", intrusive: false },
  { id: "header", label: "HTTP headers", desc: "CSP, HSTS, …", intrusive: false },
  { id: "ssl", label: "TLS / SSL", desc: "Cert & cipher", intrusive: false },
  { id: "inject", label: "Reflection", desc: "XSS / SQLi echo", intrusive: true },
];

export default function ScanInput({ onScanStarted }) {
  const [target, setTarget] = useState("");
  const [modules, setModules] = useState(["port", "header", "ssl", "inject"]);
  const [schedule, setSchedule] = useState("once");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (val) => {
    const urlRe = /^https?:\/\/([\w.-]+)(:\d+)?(\/.*)?$/i;
    const ipRe = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
    if (!val) {
      setError("");
      return;
    }
    if (!urlRe.test(val) && !ipRe.test(val)) {
      setError("Enter a valid URL or IP address");
      return;
    }
    setError("");
  };

  const toggleModule = (id) =>
    setModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await postScan({
        target,
        modules,
        schedule,
        notify_email: schedule !== "once" ? email || null : null,
        consent: true,
      });
      onScanStarted(data.scan_id);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const valid = !error && target.length > 0 && modules.length > 0 && consent;

  return (
    <Card className="animate-fade-in p-6 sm:p-8 ring-1 ring-primary/15">
      <CardHeader className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 shadow-[0_0_16px_-4px_rgba(220,38,38,0.4)]">
            <Crosshair className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">Configure scan</h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300/95 shadow-[0_0_12px_-2px_rgba(239,68,68,0.35)]">
                <Sparkles className="h-3 w-3" />
                Live
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Modules call the Sentinel Scanner API; results stream into the dashboard with aggregate risk scoring.
            </p>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Target
          </label>
          <input
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 font-mono text-sm text-slate-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/[0.02] focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              validate(e.target.value);
            }}
            placeholder="https://example.com or 203.0.113.10"
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p className="mt-2 flex items-center gap-2 text-sm text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Modules
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {MODULES.map((m) => {
              const Icon = MODULE_ICONS[m.id] || Network;
              const active = modules.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-1 rounded-xl border px-3.5 py-3.5 transition-all duration-300",
                    active
                      ? "border-primary/45 bg-primary/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_12px_-4px_rgba(220,38,38,0.25)] ring-1 ring-primary/20"
                      : "border-white/[0.06] bg-black/20 hover:border-white/[0.1] hover:bg-black/40",
                    m.intrusive && active && "ring-amber-500/30 border-amber-500/40 bg-amber-500/[0.04]",
                    m.intrusive && !active && "ring-1 ring-amber-500/10",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={active} onChange={() => toggleModule(m.id)} />
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn("h-4 w-4 shrink-0 transition-colors duration-300", active ? (m.intrusive ? "text-amber-400" : "text-primary/90") : "text-slate-500 group-hover:text-slate-400")}
                      aria-hidden
                    />
                    <span className={cn("text-sm font-medium", active ? "text-white" : "text-slate-300")}>{m.label}</span>
                    {m.intrusive && (
                      <span className="ml-auto rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400">
                        CAREFUL
                      </span>
                    )}
                  </div>
                  <span className="pl-[1.625rem] text-[11px] text-slate-500">{m.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 transition-colors hover:bg-black/40">
          <label className="flex cursor-pointer items-start gap-3 text-left">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-surface-900 text-primary focus:ring-2 focus:ring-primary/35"
            />
            <span className="text-sm leading-relaxed text-slate-300">
              I confirm I am authorized to test this target (systems I own or have written permission to assess). Scans may be logged with consent time and IP.
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              Schedule
            </label>
            <select
              className="h-11 w-full cursor-pointer rounded-xl border border-white/[0.08] bg-black/40 px-3 text-sm text-slate-200 focus:border-primary/50 focus:bg-white/[0.02] focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            >
              <option value="once">Run once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {schedule !== "once" && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                Notify
              </label>
              <input
                type="email"
                className="h-11 w-full rounded-lg border border-slate-700/60 bg-surface-900/90 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!valid || submitting}
          className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-t from-red-600/90 to-red-500 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_rgba(220,38,38,0.35)] transition-all hover:from-red-500 hover:to-red-400 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_20px_rgba(220,38,38,0.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
          {submitting ? (
            <>
              <Loader2 className="relative h-4 w-4 animate-spin" aria-hidden />
              <span className="relative">Starting…</span>
            </>
          ) : (
            <>
              <Play className="relative h-4 w-4" strokeWidth={2.25} aria-hidden />
              <span className="relative">Launch scan</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
