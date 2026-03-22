import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, X, AlertTriangle, Lightbulb, Shield } from "lucide-react";
import { cn } from "../lib/cn.js";

const TABS = [
  { id: "problem", label: "Problem", icon: AlertTriangle },
  { id: "solution", label: "Solution", icon: Lightbulb },
  { id: "practices", label: "Best Practices", icon: Shield },
];

function parseExplanationSections(text) {
  if (!text) return { problem: "", solution: "", practices: "" };

  const sections = { problem: "", solution: "", practices: "" };
  
  // Standard Markdown Header Split
  const parts = text.split(/(?=^#{1,3}\s+)/m);
  
  if (parts.length > 1) {
    parts.forEach(part => {
      const lower = part.toLowerCase();
      const content = part.replace(/^#{1,3}\s+.+?\n/, "").trim();
      if (lower.includes("problem") || lower.includes("vulnerability") || lower.includes("overview"))
        sections.problem = content;
      else if (lower.includes("solution") || lower.includes("remediation") || lower.includes("fix"))
        sections.solution = content;
      else if (lower.includes("best") || lower.includes("practice") || lower.includes("recommendation"))
        sections.practices = content;
    });
  }

  // Fallback: If no markdown headers, look for plain text labels (e.g., "Problem:", "Solution:")
  if (!sections.problem && !sections.solution && !sections.practices) {
    const lines = text.split("\n");
    let currentKey = "solution";
    lines.forEach(line => {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith("problem:") || lower.startsWith("**problem**")) currentKey = "problem";
      else if (lower.startsWith("solution:") || lower.startsWith("**solution**") || lower.startsWith("remediation:")) currentKey = "solution";
      else if (lower.startsWith("best practice:") || lower.startsWith("**best practice**")) currentKey = "practices";
      
      sections[currentKey] += line + "\n";
    });
  }

  // Final cleanup: if everything is empty, put all text in solution
  if (!sections.problem.trim() && !sections.solution.trim() && !sections.practices.trim()) {
    sections.solution = text.trim();
  }

  return {
    problem: sections.problem.trim(),
    solution: sections.solution.trim(),
    practices: sections.practices.trim()
  };
}

export default function FindingDrawer({ open, title, loading, explanation, source, error, onClose }) {
  const closeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("solution");

  useEffect(() => {
    if (!open) return;
    setActiveTab("solution");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sections = parseExplanationSections(explanation);
  const hasMultipleSections = !!(sections.problem || sections.practices);
  const activeContent = sections[activeTab] || sections.solution || explanation;

  const sourceLabel =
    source === "gemini" ? "✦ Gemini AI" :
    source === "openrouter" ? "⬡ OpenRouter" :
    source === "openai" ? "◆ OpenAI" :
    source === "anthropic" ? "◈ Claude" : "Local AI";

  const sourceColor =
    source === "gemini" ? { bg: "bg-teal-500/10", ring: "ring-teal-500/25", text: "text-teal-300", icon: "text-teal-400" } :
    source === "openrouter" ? { bg: "bg-violet-500/10", ring: "ring-violet-500/25", text: "text-violet-300", icon: "text-violet-400" } :
    source === "openai" ? { bg: "bg-emerald-500/10", ring: "ring-emerald-500/25", text: "text-emerald-300", icon: "text-emerald-400" } :
    source === "anthropic" ? { bg: "bg-amber-500/10", ring: "ring-amber-500/25", text: "text-amber-300", icon: "text-amber-400" } :
    { bg: "bg-white/[0.03]", ring: "ring-white/[0.06]", text: "text-slate-400", icon: "text-primary/80" };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close explanation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finding-drawer-title"
        className="relative z-[101] flex max-h-[min(85vh,760px)] w-full max-w-xl flex-col rounded-t-2xl border border-white/[0.08] bg-surface-900 shadow-2xl ring-1 ring-white/[0.06] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0 flex items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1 ring-1", sourceColor.bg, sourceColor.ring)}>
              <Sparkles className={cn("h-3.5 w-3.5", sourceColor.icon)} aria-hidden />
              <span className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", sourceColor.text)}>
                {sourceLabel}
              </span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Finding Title */}
        {title && (
          <div className="border-b border-white/[0.06] px-5 py-3">
            <p id="finding-drawer-title" className="text-sm font-semibold text-white leading-snug">{title}</p>
          </div>
        )}

        {/* Tabs — only when content has sections */}
        {!loading && !error && explanation && hasMultipleSections && (
          <div className="flex border-b border-white/[0.06]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const hasContent = !!sections[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!hasContent}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-[11px] font-semibold tracking-wide transition-colors",
                    isActive
                      ? "border-b-2 border-primary text-white"
                      : hasContent
                      ? "text-slate-500 hover:text-slate-300"
                      : "cursor-not-allowed text-slate-700"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating AI analysis…
            </div>
          )}
          {error && (
            <p className="text-sm text-rose-300" role="alert">{error}</p>
          )}
          {!loading && !error && explanation && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-slate-300">
                {activeContent}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
