import { useEffect, useState } from "react";
import { getHistory } from "../api.js";
import { Activity } from "lucide-react";
import { Card } from "./ui/Card.jsx";
import { cn } from "../lib/cn.js";

export default function TrendChart({ target }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    getHistory(target)
      .then((data) => setHistory(data))
      .catch((e) => {
        console.error(e);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [target]);

  // Need at least 2 points to draw a trend
  if (loading || history.length < 2) return null;

  const width = 300;
  const height = 40;
  const minScore = 0;
  const maxScore = 10;
  
  const stepX = width / (history.length - 1);
  const points = history.map((item, i) => {
    const x = i * stepX;
    // Keep it clamped between 0 and 10 and map to inverted Y (0 is top)
    const clamped = Math.max(0, Math.min(10, item.health_score || 0));
    const y = height - (clamped / maxScore) * height;
    return `${x},${y}`;
  }).join(" ");

  const scores = history.map(h => h.health_score || 0);
  const current = scores[scores.length - 1];
  const previous = scores[scores.length - 2];
  const diff = current - previous;

  return (
    <Card className="flex flex-col border border-white/[0.04] bg-surface-850/40 p-5 mt-6 lg:mt-0 lg:ml-6">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          Health Trend
        </h3>
        <span className={cn(
             "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ring-1",
             diff > 0 
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" 
              : diff < 0 
                ? "bg-red-500/10 text-red-400 ring-red-500/20" 
                : "bg-white/5 text-slate-400 ring-white/10"
          )}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
      
      <div className="relative w-full flex-1 min-h-[40px]">
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Subtle grid lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.05)" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(255,255,255,0.05)" />
          
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500 transition-all duration-1000"
            points={points}
            style={{ filter: "drop-shadow(0 4px 6px rgba(59,130,246,0.3))" }}
          />
          {history.map((item, i) => {
            const x = i * stepX;
            const clamped = Math.max(0, Math.min(10, item.health_score || 0));
            const y = height - (clamped / maxScore) * height;
            return (
              <circle 
                key={item.scan_id} 
                cx={x} cy={y} r="3" 
                fill="#1e293b" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-blue-400"
              />
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
