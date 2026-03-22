import { cn } from "../lib/cn.js";

const variants = {
  running: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  complete: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  failed: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25",
  queued: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/25",
  default: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20",
};

export default function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  let key = "default";
  if (s === "complete") key = "complete";
  else if (s.startsWith("failed")) key = "failed";
  else if (s === "queued") key = "queued";
  else if (s.startsWith("running") || (s && s !== "complete")) key = "running";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        variants[key],
      )}
    >
      {key === "running" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
      )}
      {status || "—"}
    </span>
  );
}
