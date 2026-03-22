import { useState, useEffect } from "react";
import { AlertOctagon, Sparkles, ChevronDown, GitFork, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "../lib/cn.js";
import { postAttackPath, getEpss } from "../api.js";

const riskConfig = {
  critical: {
    bar: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-200 ring-rose-500/25",
    glow: "shadow-[0_0_24px_-4px_rgba(244,63,94,0.35)]",
  },
  high: {
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-200 ring-red-500/25",
    glow: "shadow-[0_0_24px_-4px_rgba(239,68,68,0.35)]",
  },
  medium: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
    glow: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.25)]",
  },
  low: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25",
    glow: "shadow-[0_0_20px_-4px_rgba(52,211,153,0.2)]",
  },
  info: {
    bar: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-200 ring-blue-500/25",
    glow: "shadow-[0_0_20px_-4px_rgba(59,130,246,0.2)]",
  },
};

// Attack Path sub-component
function AttackPath({ finding }) {
  const [steps, setSteps] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    postAttackPath(finding)
      .then((d) => setSteps(d.steps || []))
      .catch(() => setSteps([]))
      .finally(() => setLoading(false));
  }, [finding.type]);

  if (loading) return (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
      <Loader2 className="h-3 w-3 animate-spin" />
      Building attack path…
    </div>
  );

  if (!steps?.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitFork className="h-3.5 w-3.5 text-primary/80" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Attack Path</span>
      </div>
      <div className="relative flex flex-col gap-3 pl-4">
        {/* Vertical connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/[0.06]" />

        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="relative flex items-start gap-3">
              <div className={cn(
                "relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-black",
                isFirst ? "bg-indigo-500" : isLast ? "bg-rose-500" : "bg-slate-600"
              )} />
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isFirst ? "text-indigo-400" : isLast ? "text-rose-400" : "text-slate-500"
                )}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// EPSS sub-component (only shown when finding has a cve_id field)
function EpssPanel({ cveId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cveId) return;
    setLoading(true);
    getEpss(cveId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [cveId]);

  if (!cveId) return null;
  if (loading) return (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
      <Loader2 className="h-3 w-3 animate-spin" />
      Fetching EPSS score…
    </div>
  );
  if (!data?.epss) return null;

  const epssPercent = (data.epss * 100).toFixed(3);
  const pctPercent = (data.percentile * 100).toFixed(1);
  const barWidth = Math.min(data.epss * 100 * 5, 100); // Scale 0-20% EPSS to full bar

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">EPSS Score</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500">{cveId}</span>
      </div>
      <div className="flex items-end gap-4 mb-3">
        <div>
          <p className="text-[10px] text-slate-500">Score</p>
          <p className="font-mono text-lg font-bold text-white">{epssPercent}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Percentile</p>
          <p className="font-mono text-lg font-bold text-white">{pctPercent}%</p>
        </div>
        <p className="ml-auto text-[11px] text-slate-500">
          {data.epss < 0.01 ? "Low" : data.epss < 0.1 ? "Moderate" : "High"} exploitation probability
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

export default function VulnCard({ finding, onExplain, defaultExpanded = false, badge, badgeColor }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const risk = (finding.risk || "low").toLowerCase();
  const cfg = riskConfig[risk] || riskConfig.low;
  const isSevere = risk === "critical" || risk === "high";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-850/60 transition-all duration-300",
        expanded ? "border-white/[0.12] bg-surface-800/80" : "hover:border-white/[0.1]",
        cfg.glow,
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-2xl", cfg.bar)} aria-hidden />
      <div className="pl-5 pr-4 py-4">
        <div
          className="cursor-pointer select-none flex flex-col gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {isSevere && <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400/90" aria-hidden />}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
                  cfg.badge,
                )}
              >
                {risk}
              </span>
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
                    badgeColor === "blue" ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" :
                    badgeColor === "green" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" :
                    "bg-slate-500/10 text-slate-400 ring-slate-500/25"
                  )}
                >
                  {badge}
                </span>
              )}
              <span className="font-mono text-xs text-slate-500">CVSS {Number(finding.cvss ?? 0).toFixed(1)}</span>
              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{finding.type}</span>
            </div>

            <div className="flex items-center gap-3">
              {typeof onExplain === "function" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExplain(finding);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-200/90 transition hover:border-red-400/40 hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Explain</span>
                </button>
              )}
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded ? "rotate-180" : "")} aria-hidden />
              </div>
            </div>
          </div>
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-white pr-10">
            {finding.title || finding.type}
          </h3>
        </div>

        {/* Collapsible Content */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
          )}
        >
          <div className="overflow-hidden">
            {finding.description && (
              <p className="mb-3 text-sm leading-relaxed text-slate-400">{finding.description}</p>
            )}
            {finding.affected_component && (
              <p className="mb-3 rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-slate-400 ring-1 ring-white/[0.04]">
                <span className="text-slate-600">Scope · </span>
                {finding.affected_component}
              </p>
            )}
            {finding.mitigation && (
              <div className="mt-3 border-t border-white/[0.06] pt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/85">Remediation</p>
                <p className="text-sm leading-relaxed text-slate-300">{finding.mitigation}</p>
              </div>
            )}

            {/* Attack Path — auto-generated for all expanded findings */}
            {expanded && <AttackPath finding={finding} />}

            {/* EPSS Score — only for findings that carry a CVE ID */}
            {expanded && finding.cve_id && <EpssPanel cveId={finding.cve_id} />}
          </div>
        </div>
      </div>
    </article>
  );
}
