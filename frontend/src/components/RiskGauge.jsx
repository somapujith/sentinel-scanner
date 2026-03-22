import { useId } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { Card } from "./ui/Card.jsx";
import { cn } from "../lib/cn.js";

const strokeForScore = (score) => {
  // Score is now a Health/Security Score where 10 is perfect (Green)
  if (score >= 9.0) return { a: "#6ee7b7", b: "#10b981" }; // Green
  if (score >= 7.0) return { a: "#fde047", b: "#eab308" }; // Yellow
  if (score >= 4.0) return { a: "#fdba74", b: "#f97316" }; // Orange
  if (score >= 0.1) return { a: "#fb7185", b: "#f43f5e" }; // Red
  return { a: "#be123c", b: "#9f1239" }; // Dark Red (Critical)
};

const gradeForScore = (score) => {
  if (score >= 9.5) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 7.0) return "B";
  if (score >= 5.0) return "C";
  if (score >= 3.0) return "D";
  return "F";
};

export default function RiskGauge({ score = 0, label = "Security Score", status = "complete" }) {
  const gid = useId();
  const isRunning = status !== "complete" && !status?.startsWith("failed");

  // Invert the CVSS risk score (0-10) to a Health Score (0-10) where 10 is safe
  const healthScore = Math.max(0, 10 - score);
  
  const pct = isRunning ? 30 : Math.min(100, (healthScore / 10) * 100);
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const grad = isRunning ? { a: "#3b82f6", b: "#2563eb" } : strokeForScore(healthScore);
  const gradId = `gauge-grad-${gid.replace(/:/g, "")}`;

  const grade = gradeForScore(healthScore);

  return (
    <Card className="relative flex h-fit flex-col items-center overflow-hidden border border-white/[0.04] py-8">
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-colors duration-1000",
        isRunning ? "bg-blue-500/20" : "bg-primary/10"
      )} aria-hidden />
      
      <div className="relative flex flex-col items-center py-2">
        <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          <Gauge className={cn("h-3.5 w-3.5", isRunning ? "text-blue-400 animate-pulse" : "text-primary/75")} aria-hidden />
          {label}
        </p>
        
        <div className="relative h-[9.5rem] w-[9.5rem]">
          <svg className={cn("-rotate-90 transition-transform duration-1000", isRunning && "animate-[spin_3s_linear_infinite]")} viewBox="0 0 128 128" aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={grad.a} />
                <stop offset="100%" stopColor={grad.b} />
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              className="transition-[stroke-dasharray] duration-1000 ease-in-out"
              style={{ filter: `drop-shadow(0 0 8px ${grad.b}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isRunning ? (
              <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80">Analyzing</span>
              </div>
            ) : (
              <>
                <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-white">{healthScore.toFixed(1)}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">/ 10</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-5 flex flex-col items-center min-h-[64px] justify-center text-center">
          {isRunning ? (
            <p className="max-w-[180px] text-[10px] font-medium leading-relaxed text-slate-500 italic">
              Probing target environment and calculating risk vectors...
            </p>
          ) : (
            <>
              <span className="mb-2 rounded-lg bg-black/40 px-3 py-1 font-mono text-sm font-bold text-slate-200 ring-1 ring-white/[0.06] shadow-inner">
                Grade: <span style={{ color: grad.a }}>{grade}</span>
              </span>
              <p className="max-w-[200px] text-[10px] font-medium leading-relaxed text-slate-500">
                Overall health calculated from aggregate security posture.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
