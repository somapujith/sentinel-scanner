import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Shield } from "lucide-react";
import ScheduledJobs from "./components/ScheduledJobs.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import { cn } from "./lib/cn.js";

export default function ScheduledPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-950">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-surface-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/app"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/18 to-sky-600/10 ring-1 ring-cyan-400/25"
              aria-label="App home"
            >
              <Shield className="h-5 w-5 text-cyan-400" strokeWidth={1.75} aria-hidden />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Scheduled scans</h1>
              <p className="text-sm text-slate-500">Recurring jobs — daily / weekly templates (PRD §3.4)</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-lg border border-slate-700/60 px-3.5 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white sm:inline-flex"
            >
              Home
            </Link>
            <Link
              to="/app"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              New scan
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-sm font-medium text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ScheduledJobs onRunStarted={(id) => navigate(`/scan/${id}`)} />
      </main>

      <SiteFooter variant="minimal" />
    </div>
  );
}
