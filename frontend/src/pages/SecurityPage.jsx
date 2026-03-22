import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Lock, Network, Shield } from "lucide-react";
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

export default function SecurityPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-950 text-slate-200">
      <Background />
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-surface-950/85 backdrop-blur-xl">
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
            className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-sm font-medium text-cyan-200"
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/25">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Security &amp; trust</h1>
            <p className="mt-1 text-sm text-slate-400">Operations, privacy, and responsible use</p>
          </div>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight text-amber-200">Legal &amp; ethical use</h2>
            <p className="text-slate-400 mt-2">
              Use Sentinel Scanner only on systems you own or have <strong className="text-slate-300">explicit authorization</strong>{" "}
              to test. Unauthorized scanning may violate law and policy; misuse is your responsibility.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <KeyRound className="h-5 w-5 text-cyan-400" />
              API authentication
            </h2>
            <p className="text-slate-400 mt-3">
              When enabled, optional API keys protect <code className="font-mono text-xs text-cyan-300/90">/api/*</code> routes
              except health checks. Configure keys on the server; never commit secrets. The client may use a public{" "}
              <code className="font-mono text-xs">VITE_API_KEY</code> when required by your deployment.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <Network className="h-5 w-5 text-cyan-400" />
              CORS &amp; trusted proxies
            </h2>
            <p className="text-slate-400 mt-3">
              CORS is configurable for your frontend origin. When behind nginx or Cloudflare, configure trusted proxies so
              client IP logging for consent reflects the real visitor.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <Lock className="h-5 w-5 text-cyan-400" />
              Rate limits
            </h2>
            <p className="text-slate-400 mt-3">
              Sensitive POST endpoints (e.g. starting scans) can be rate-limited per API key or per IP to reduce abuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-white">Privacy &amp; data</h2>
            <p className="text-slate-400 mt-3">
              The server may log consent timestamps, client IP, scan metadata, and findings (typically SQLite). Review your
              deployment’s retention and backup policy. Secrets belong in environment variables only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-white">Reflection probes</h2>
            <p className="text-slate-400 mt-3">
              “Reflection” probes look for echo of test strings in responses. They indicate a <strong className="text-slate-300">signal</strong>, not a
              confirmed exploitable XSS or SQL injection. Use this module only when appropriate for your authorized scope.
            </p>
          </section>

          <p className="text-slate-500 text-xs border-t border-white/[0.06] pt-8">
            See also{" "}
            <Link to="/docs" className="text-cyan-400 hover:underline">
              Documentation
            </Link>{" "}
            and your repo&apos;s <code className="font-mono">SECURITY.md</code> if present.
          </p>
        </div>
      </main>

      <SiteFooter variant="minimal" />
    </div>
  );
}
