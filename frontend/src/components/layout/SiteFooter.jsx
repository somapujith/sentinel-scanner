import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Documentation", to: "/docs" },
  { label: "Security & trust", to: "/security" },
  { label: "Open app", to: "/app" },
];

export default function SiteFooter({ variant = "default" }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={
        variant === "minimal"
          ? "border-t border-slate-800/50 py-8 text-center"
          : "border-t border-slate-800/50 bg-surface-950/80 py-12"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {variant !== "minimal" && (
          <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold tracking-tight text-white">Sentinel Scanner</p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                Web security audit tool — ports, TLS, headers, and careful probes with scoring and exports. Authorized use only.
              </p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {FOOTER_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ))}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" aria-hidden />
                GitHub
              </a>
            </nav>
          </div>
        )}
        <p className="text-xs text-slate-600">
          © {year} Sentinel Scanner · Not a replacement for full penetration testing or compliance certification.
        </p>
      </div>
    </footer>
  );
}
