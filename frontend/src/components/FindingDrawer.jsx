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
  
  // 1. Precise Header Splitting
  // We split by headers and then look at the label to assign the following content strictly
  const headerRegex = /^#{1,3}\s+(.+?)$/gm;
  const parts = text.split(headerRegex);
  // parts[0] is everything before the first header (usually nothing or intro)
  // parts[1] is the first header label, parts[2] is its content, and so on.
  
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const label = parts[i].toLowerCase();
      const content = parts[i + 1]?.trim() || "";
      if (label.includes("problem") || label.includes("vulnerability") || label.includes("overview"))
        sections.problem = content;
      else if (label.includes("solution") || label.includes("remediation") || label.includes("fix") || label.includes("remedy"))
        sections.solution = content;
      else if (label.includes("best") || label.includes("practice") || label.includes("recommendation") || label.includes("prevention"))
        sections.practices = content;
    }
  }

  // 2. Fallback to Plain Text Labels (e.g., "Problem:", "Solution:")
  if (!sections.problem && !sections.solution && !sections.practices) {
    const sectionStarts = [
      { key: "problem", regex: /(?:problem|vulnerability|overview):/i },
      { key: "solution", regex: /(?:solution|remediation|remediation steps|remedy):/i },
      { key: "practices", regex: /(?:best practices|recommendations|prevention):/i }
    ];
    
    let lastKey = null;
    text.split("\n").forEach(line => {
      const match = sectionStarts.find(s => s.regex.test(line));
      if (match) lastKey = match.key;
      if (lastKey) sections[lastKey] = (sections[lastKey] || "") + line + "\n";
    });
  }

  // 3. Final Fail-Safe: provide distinct content if AI failed to format properly
  if (!sections.problem.trim()) sections.problem = text.split("\n")[0] || "No specific problem details provided.";
  if (!sections.solution.trim()) sections.solution = text.trim();
  if (!sections.practices.trim()) {
      sections.practices = "Follow general security hardening guidelines:\n1. Regularly update your server environment.\n2. Implement a defense-in-depth strategy.\n3. Conduct periodic automated scans and manual audits.";
  }

  return {
    problem: sections.problem.trim(),
    solution: sections.solution.trim().replace(/^(?:solution|remediation|remediation steps|remedy):/i, "").trim(),
    practices: sections.practices.trim().replace(/^(?:best practices|recommendations|prevention):/i, "").trim()
  };
}

export default function FindingDrawer({ open, title, loading, explanation, source, error, onClose }) {
  const closeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("solution");

  useEffect(() => {
    if (!open) return;
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
  const activeContent = sections[activeTab] || "";
  const hasMultipleSections = !!(sections.problem || sections.practices || sections.solution);

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
