import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  CalendarClock,
  ChevronRight,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { SentinelLogo } from "./branding/SentinelLogo";
import { listScans } from "../api.js";
import { cn } from "../lib/cn.js";
import { logout } from "../pages/LoginPage.jsx";

const navBtn =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export default function ScannerSidebar() {
  const location = useLocation();
  const [history, setHistory] = useState([]);

  const isWorkspaceRoot = location.pathname === "/app";
  const isScheduled = location.pathname.startsWith("/app/scheduled");

  useEffect(() => {
    listScans()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [location.pathname]);

  return (
    <aside className="relative z-20 flex w-full shrink-0 flex-col border-b border-white/[0.04] bg-surface-950/40 backdrop-blur-xl md:w-[260px] md:border-b-0 md:border-r md:border-white/[0.04]">
      <div className="border-b border-white/[0.04] px-5 py-6">
        <SentinelLogo variant="lockup" to="/app" />
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Ports, TLS, headers, probes — scored &amp; exportable.{" "}
          <span className="font-semibold uppercase tracking-wide text-slate-600">Authorized only</span>
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 px-3 py-3 md:flex-col md:gap-0.5" aria-label="Dashboard">
        <Link
          to="/app"
          className={cn(
            navBtn,
            isWorkspaceRoot && !isScheduled
              ? "bg-primary/[0.08] text-white shadow-[inset_2px_0_0_rgba(220,38,38,1),inset_0_1px_0_rgba(255,255,255,0.05),0_0_16px_-4px_rgba(220,38,38,0.25)] ring-1 ring-primary/20"
              : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
          )}
          aria-current={isWorkspaceRoot && !isScheduled ? "page" : undefined}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          New scan
        </Link>
        <NavLink
          to="/app/scheduled"
          className={({ isActive }) =>
            cn(
              navBtn,
              isActive
                ? "bg-primary/[0.08] text-white shadow-[inset_2px_0_0_rgba(220,38,38,1),inset_0_1px_0_rgba(255,255,255,0.05),0_0_16px_-4px_rgba(220,38,38,0.25)] ring-1 ring-primary/20"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
            )
          }
        >
          <CalendarClock className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          Scheduled
        </NavLink>
        <Link
          to="/"
          className={cn(navBtn, "text-slate-400 hover:bg-white/[0.04] hover:text-white")}
        >
          <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          About
        </Link>
      </nav>

      <div className="mt-1 flex min-h-0 flex-1 flex-col border-t border-white/[0.04] px-3 pb-4 pt-4 md:mt-0">
        <h3 className="mb-1 flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          <History className="h-3.5 w-3.5" aria-hidden />
          History
        </h3>
        <ul className="max-h-40 overflow-y-auto md:max-h-[min(420px,calc(100vh-26rem))] md:flex-1">
          {history.map((h) => (
            <li key={h.id}>
              <NavLink
                to={`/app/scan/${h.id}`}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors",
                    isActive
                      ? "bg-primary/10 ring-1 ring-primary/25 shadow-[inset_2px_0_0_rgba(220,38,38,0.5)]"
                      : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200",
                  )
                }
              >
                {/* Color-coded health dot */}
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  h.status === "complete" ? "bg-emerald-400" :
                  h.status?.startsWith("running") ? "bg-blue-400 animate-pulse" :
                  h.status?.startsWith("failed") ? "bg-rose-500" : "bg-slate-500"
                )} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px] text-slate-300">{h.target}</div>
                  <div className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-slate-600">{h.status}</div>
                </div>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden
                />
              </NavLink>
            </li>
          ))}
        </ul>
        {history.length === 0 && (
          <p className="px-3 py-2 text-center text-[11px] text-slate-600">No scans yet.</p>
        )}
      </div>

      {/* Logout button at the very bottom of the sidebar */}
      <div className="border-t border-white/[0.04] px-3 py-3">
        <button
          type="button"
          onClick={logout}
          className={cn(navBtn, "w-full text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors")}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
