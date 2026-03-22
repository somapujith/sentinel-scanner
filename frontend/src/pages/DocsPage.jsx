import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Radio, Server, Shield } from "lucide-react";
import SiteFooter from "../components/layout/SiteFooter.jsx";

function Background() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-hero-glow" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
    </>
  );
}

export default function DocsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-slate-200">
      <Background />
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link
            to="/app"
            className="rounded-lg border border-primary/40 bg-primary/12 px-3.5 py-2 text-sm font-medium text-red-100"
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/30">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Documentation</h1>
            <p className="mt-1 text-sm text-slate-400">How Sentinel Scanner works</p>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-slate-300">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
              <Server className="h-5 w-5 text-primary" />
              Scan configuration
            </h2>
            <ul className="text-slate-400 mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>
                <strong className="text-slate-300">Target:</strong> HTTPS URL or IP with validation in the UI.
              </li>
              <li>
                <strong className="text-slate-300">Modules:</strong> Port scan, HTTP headers, TLS/SSL, and optional reflection
                / injection-style probes (marked intrusive; use with care).
              </li>
              <li>
                <strong className="text-slate-300">Schedule:</strong> Once, daily, or weekly (recurring job template).
              </li>
              <li>
                <strong className="text-slate-300">Consent:</strong> Required before launch; server stores consent timestamp and
                client IP (trusted reverse proxies when configured).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
              <Radio className="h-5 w-5 text-primary" />
              Execution &amp; live updates
            </h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Scans run in the background with status progression: queued → running per module → complete or failed. The UI
              uses Server-Sent Events (<code className="font-mono text-xs text-primary/90">/events</code>) plus polling for
              scan detail so the interface stays responsive.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
              <Shield className="h-5 w-5 text-primary" />
              Results &amp; risk model
            </h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Findings include title, type, risk tier, CVSS-style score, description, affected component, and mitigation hints.
              The engine applies aggregate risk scoring with per-finding severity-style labels. Optional AI explanations use
              Anthropic when <code className="font-mono text-xs text-primary/90">ANTHROPIC_API_KEY</code> is set; otherwise a
              local fallback message is shown.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-white">Exports &amp; compare</h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Export reports as PDF (ReportLab), JSON, or CSV. You can compare two scans to see counts for only-left,
              only-right, and unchanged findings (baseline vs later run).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-white">History &amp; scheduled scans</h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Scan history lists targets and status. You can delete scans (cascades findings). The Scheduled page lists
              recurring jobs with enable/disable, delete, and run-now without shifting the schedule. Optional retention can
              purge scans older than N days (server ops).
            </p>
          </section>

          <p className="text-slate-500 text-xs border-t border-white/[0.06] pt-8">
            For API keys, CORS, rate limits, and proxies, see{" "}
            <Link to="/security" className="text-primary hover:underline">
              Security &amp; trust
            </Link>
            . Repository may include <code className="font-mono">SECURITY.md</code> for deployment hardening.
          </p>
        </div>
      </main>

      <SiteFooter variant="minimal" />
    </div>
  );
}
