import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarClock, LayoutDashboard, Shield } from "lucide-react";
import Dashboard from "../components/Dashboard.jsx";
import ScanInput from "../components/ScanInput.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import { cn } from "../lib/cn.js";

export default function ScannerPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-950">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-surface-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 px-4 py-5 sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              to="/app"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/18 to-sky-600/10 ring-1 ring-cyan-400/25"
              aria-label="Sentinel Scanner home"
            >
              <Shield className="h-5 w-5 text-cyan-400" strokeWidth={1.75} aria-hidden />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/app"
                  className="text-lg font-bold tracking-tight text-white sm:text-xl hover:text-cyan-50/95"
                >
                  Sentinel
                </Link>
                <span className="rounded border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Scanner
                </span>
              </div>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-400">
                Port discovery, TLS review, HTTP headers, and reflection probes — scored and exportable to PDF.{" "}
                <span className="whitespace-nowrap font-semibold uppercase tracking-wide text-slate-500">
                  Authorized testing only
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2.5 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="hidden text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300 sm:inline"
            >
              About
            </Link>
            <Link
              to="/scheduled"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.06] px-3.5 py-2 text-sm font-medium text-cyan-200/95 hover:border-cyan-400/35 hover:bg-cyan-500/10"
            >
              <CalendarClock className="h-4 w-4 opacity-90" />
              Scheduled
            </Link>
            <Link
              to="/app"
              aria-current={!scanId ? "page" : undefined}
              className={cn(
                "group inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all",
                !scanId
                  ? "border-cyan-400/35 bg-cyan-500/10 text-cyan-200 shadow-glow"
                  : "border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 hover:text-white",
              )}
            >
              <LayoutDashboard className="h-4 w-4 opacity-90" />
              New scan
              {!scanId && <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-10">
          <ScanInput
            onScanStarted={(id) => {
              navigate(`/scan/${id}`);
            }}
          />
          <Dashboard
            scanId={scanId}
            onSelectScan={(id) => navigate(`/scan/${id}`)}
            onScanDeleted={() => navigate("/app")}
          />
        </div>
      </main>

      <SiteFooter variant="minimal" />
    </div>
  );
}
