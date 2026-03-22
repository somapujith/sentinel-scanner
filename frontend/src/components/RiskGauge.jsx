import { useId } from "react";
import { Gauge } from "lucide-react";
import { Card } from "./ui/Card.jsx";

const strokeForScore = (score) => {
  if (score >= 9) return { a: "#fb7185", b: "#f43f5e" };
  if (score >= 7) return { a: "#fca5a5", b: "#ef4444" };
  if (score >= 4) return { a: "#fde047", b: "#eab308" };
  return { a: "#6ee7b7", b: "#10b981" };
};

export default function RiskGauge({ score = 0, label = "Aggregate risk" }) {
  const gid = useId();
  const pct = Math.min(100, (score / 10) * 100);
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const grad = strokeForScore(score);
  const gradId = `gauge-grad-${gid.replace(/:/g, "")}`;

  return (
    <Card className="relative overflow-hidden ring-1 ring-slate-800/45">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" aria-hidden />
      <div className="relative flex flex-col items-center py-2">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <Gauge className="h-3.5 w-3.5 text-cyan-500/70" aria-hidden />
          {label}
        </p>
        <div className="relative h-[9.5rem] w-[9.5rem]">
          <svg className="-rotate-90" viewBox="0 0 128 128" aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={grad.a} />
                <stop offset="100%" stopColor={grad.b} />
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(30,41,59,0.9)" strokeWidth="12" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              className="transition-[stroke-dasharray] duration-700 ease-out"
              style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.25))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-white">{score.toFixed(1)}</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">/ 10</span>
          </div>
        </div>
        <p className="mt-4 max-w-[200px] text-center text-[11px] leading-relaxed text-slate-500">
          Mean weighted score across findings (CVSS-style weights)
        </p>
      </div>
    </Card>
  );
}
