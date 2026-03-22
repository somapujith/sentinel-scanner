import { useState } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import { downloadReportBlob } from "../api.js";
import { cn } from "../lib/cn.js";

export default function ReportDownload({ scanId, complete }) {
  const [busy, setBusy] = useState(false);

  if (!scanId) return null;

  const onClick = async (e) => {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    try {
      const blob = await downloadReportBlob(scanId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-scan-${scanId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!complete || busy}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
        complete
          ? "border-white/[0.1] bg-white/[0.06] text-white shadow-lg hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-100"
          : "cursor-not-allowed border-white/[0.04] bg-surface-900/50 text-slate-600",
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400/90" aria-hidden />
      ) : complete ? (
        <FileDown className="h-4 w-4 text-cyan-400/90" aria-hidden />
      ) : (
        <Download className="h-4 w-4 opacity-40" aria-hidden />
      )}
      {complete ? (busy ? "Preparing…" : "Download PDF") : "Report pending"}
    </button>
  );
}
