import { AlertOctagon, Sparkles } from "lucide-react";
import { cn } from "../lib/cn.js";

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
};

export default function VulnCard({ finding, onExplain }) {
  const risk = (finding.risk || "low").toLowerCase();
  const cfg = riskConfig[risk] || riskConfig.low;
  const isSevere = risk === "critical" || risk === "high";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-850/60 transition-all duration-300 hover:border-white/[0.1]",
        cfg.glow,
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-2xl", cfg.bar)} aria-hidden />
      <div className="pl-5 pr-4 py-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
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
            <span className="font-mono text-xs text-slate-500">CVSS {Number(finding.cvss ?? 0).toFixed(1)}</span>
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{finding.type}</span>
          </div>
          {typeof onExplain === "function" && (
            <button
              type="button"
              onClick={() => onExplain(finding)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-200/90 transition hover:border-red-400/40 hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Explain
            </button>
          )}
        </div>
        <h3 className="mb-2 text-[15px] font-semibold leading-snug tracking-tight text-white">
          {finding.title || finding.type}
        </h3>
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
      </div>
    </article>
  );
}
