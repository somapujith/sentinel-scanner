import { useEffect, useRef } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "../lib/cn.js";

export default function FindingDrawer({ open, title, loading, explanation, source, error, onClose }) {
  const closeRef = useRef(null);

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
        className={cn(
          "relative z-[101] flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-white/[0.08] bg-surface-900 shadow-2xl ring-1 ring-white/[0.06] sm:rounded-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <p id="finding-drawer-title" className="text-sm font-semibold tracking-tight text-white">
              AI explanation
            </p>
            {title && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{title}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating explanation…
            </div>
          )}
          {error && (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && explanation && (
            <>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-400/80" aria-hidden />
                {source === "anthropic" ? "Claude" : "Local summary"}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{explanation}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
